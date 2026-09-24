import { ordersApi } from '@/api/orders'

export interface RazorpayPayload {
  razorpay_order_id: string
  amount: number
  currency: string
  key: string
}

interface OpenOptions {
  payload: RazorpayPayload
  description: string
  prefill?: { name?: string; contact?: string; email?: string }
  onPaid: () => void
  onDismiss: () => void
  onError: (err: unknown) => void
}

/** Opens the Razorpay popup and verifies the payment with our backend. Shared by checkout + "Pay now". */
export function openRazorpay({ payload, description, prefill, onPaid, onDismiss, onError }: OpenOptions) {
  if (!window.Razorpay) {
    onError(new Error('Payment widget failed to load. Check your connection and try again.'))
    return
  }
  const rzp = new window.Razorpay({
    key: payload.key,
    amount: payload.amount,
    currency: payload.currency,
    order_id: payload.razorpay_order_id,
    name: 'zKart.shop',
    description,
    prefill,
    theme: { color: '#7C3AED' },
    handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
      try {
        await ordersApi.verifyPayment(response)
        onPaid()
      } catch (err) {
        // The backend webhook will still confirm it within a minute if money was taken.
        onError(err)
      }
    },
    modal: { ondismiss: onDismiss },
  })
  rzp.open()
}
