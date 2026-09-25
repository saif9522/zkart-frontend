import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ordersApi } from '@/api/orders'
import { apiErrorMessage } from '@/api/client'
import { useToastStore } from '@/store/toast'

/** "Order again": puts a past order's items back in the cart and opens it. */
export function useReorder() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const toast = useToastStore((s) => s.push)

  return useMutation({
    mutationFn: (orderId: string) => ordersApi.reorder(orderId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      if (res.added.length === 0) {
        toast('None of these items are available right now.')
        return
      }
      if (res.skipped.length > 0) {
        toast(`Added ${res.added.length} item(s). Not available: ${res.skipped.map((s) => s.name).join(', ')}`, 'success')
      } else {
        toast('Items added to your cart', 'success')
      }
      navigate('/cart')
    },
    onError: (err) => toast(apiErrorMessage(err, 'Could not add items to cart.')),
  })
}
