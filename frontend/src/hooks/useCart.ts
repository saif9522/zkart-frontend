import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cartApi } from '@/api/cart'
import { apiErrorMessage } from '@/api/client'
import { useAuthStore } from '@/store/auth'
import { useToastStore } from '@/store/toast'
import type { Cart, ProductListItem } from '@/types'

const CART_KEY = ['cart']

export function useCart() {
  const isAuthed = !!useAuthStore((s) => s.accessToken)
  const queryClient = useQueryClient()
  const pushToast = useToastStore((s) => s.push)

  const query = useQuery({
    queryKey: CART_KEY,
    queryFn: cartApi.get,
    enabled: isAuthed,
    staleTime: 10_000,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: CART_KEY })

  // Cart is customer-only on the backend — a vendor/admin account trying to
  // shop here gets a 403, which used to fail silently. Surface it clearly.
  const onError = (err: unknown, _vars: unknown, context: { previous?: Cart } | undefined) => {
    // Roll the optimistic change back to whatever the cart was before.
    if (context?.previous) queryClient.setQueryData(CART_KEY, context.previous)
    pushToast(apiErrorMessage(err, 'Could not update your cart. Please try again.'))
  }

  // Recompute the light summary fields so the UI (badge, totals) updates instantly.
  const withRecomputedTotals = (cart: Cart): Cart => {
    const subtotal = cart.items.reduce((sum, i) => sum + Number(i.subtotal || 0), 0)
    const item_count = cart.items.reduce((sum, i) => sum + i.quantity, 0)
    return { ...cart, subtotal, item_count, grand_total: subtotal + Number(cart.delivery_charge || 0) }
  }

  const emptyCart = (): Cart => ({
    id: 'local', items: [], coupon_code: '', subtotal: 0,
    item_count: 0, delivery_charge: 0, grand_total: 0,
  })

  // Snapshot + cancel in-flight refetches so they don't clobber our optimistic edit.
  const beginOptimistic = async () => {
    await queryClient.cancelQueries({ queryKey: CART_KEY })
    const previous = queryClient.getQueryData<Cart>(CART_KEY)
    return { previous }
  }

  const addItem = useMutation({
    mutationFn: ({ productId, quantity = 1 }: { productId: string; quantity?: number; product?: ProductListItem }) =>
      cartApi.addItem(productId, quantity),
    onMutate: async ({ productId, quantity = 1, product }) => {
      const ctx = await beginOptimistic()
      const current = ctx.previous ?? emptyCart()
      const existing = current.items.find((i) => i.product.id === productId)
      let items
      if (existing) {
        items = current.items.map((i) =>
          i.product.id === productId
            ? { ...i, quantity: i.quantity + quantity, subtotal: Number(i.product.selling_price) * (i.quantity + quantity) }
            : i,
        )
      } else if (product) {
        items = [
          ...current.items,
          {
            id: `temp-${productId}`,
            product,
            quantity,
            subtotal: Number(product.selling_price) * quantity,
          },
        ]
      } else {
        items = current.items // no product data to synthesise with; wait for server
      }
      queryClient.setQueryData(CART_KEY, withRecomputedTotals({ ...current, items }))
      return ctx
    },
    onSuccess: (cart) => queryClient.setQueryData(CART_KEY, cart),
    onError,
  })

  const updateItem = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) => cartApi.updateItem(itemId, quantity),
    onMutate: async ({ itemId, quantity }) => {
      const ctx = await beginOptimistic()
      const current = ctx.previous ?? emptyCart()
      const items = current.items.map((i) =>
        i.id === itemId ? { ...i, quantity, subtotal: Number(i.product.selling_price) * quantity } : i,
      )
      queryClient.setQueryData(CART_KEY, withRecomputedTotals({ ...current, items }))
      return ctx
    },
    onSuccess: (cart) => queryClient.setQueryData(CART_KEY, cart),
    onError,
  })

  const removeItem = useMutation({
    mutationFn: (itemId: string) => cartApi.removeItem(itemId),
    onMutate: async (itemId: string) => {
      const ctx = await beginOptimistic()
      const current = ctx.previous ?? emptyCart()
      const items = current.items.filter((i) => i.id !== itemId)
      queryClient.setQueryData(CART_KEY, withRecomputedTotals({ ...current, items }))
      return ctx
    },
    onSuccess: (cart) => queryClient.setQueryData(CART_KEY, cart),
    onError,
  })

  const clear = useMutation({
    mutationFn: cartApi.clear,
    onSuccess: invalidate,
    onError,
  })

  return {
    cart: query.data,
    isLoading: query.isLoading,
    addItem,
    updateItem,
    removeItem,
    clear,
  }
}
