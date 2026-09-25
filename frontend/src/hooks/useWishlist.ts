import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { wishlistApi } from '@/api/cart'
import { apiErrorMessage } from '@/api/client'
import { useAuthStore } from '@/store/auth'
import { useToastStore } from '@/store/toast'

const WISHLIST_KEY = ['wishlist']

export function useWishlist() {
  const isAuthed = !!useAuthStore((s) => s.accessToken)
  const queryClient = useQueryClient()
  const pushToast = useToastStore((s) => s.push)

  const query = useQuery({
    queryKey: WISHLIST_KEY,
    queryFn: wishlistApi.list,
    enabled: isAuthed,
    staleTime: 10_000,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: WISHLIST_KEY })
  const onError = (err: unknown) => pushToast(apiErrorMessage(err, 'Could not update your wishlist.'))

  const items = query.data?.results ?? []
  const isWishlisted = (productId: string) => items.some((i) => i.product.id === productId)

  const add = useMutation({
    mutationFn: (productId: string) => wishlistApi.add(productId),
    onSuccess: invalidate,
    onError,
  })

  const remove = useMutation({
    mutationFn: (id: string) => wishlistApi.remove(id),
    onSuccess: invalidate,
    onError,
  })

  const toggle = (productId: string) => {
    const existing = items.find((i) => i.product.id === productId)
    if (existing) {
      remove.mutate(existing.id)
    } else {
      add.mutate(productId)
    }
  }

  return {
    items,
    isLoading: query.isLoading,
    isWishlisted,
    add,
    remove,
    toggle,
  }
}
