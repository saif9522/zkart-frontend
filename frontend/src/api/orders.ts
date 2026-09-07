import { api } from '@/api/client'
import type { OrderDetail, OrderListItem, OrderStatus, Paginated } from '@/types'

export interface CheckoutPayload {
  address_id: string
  payment_method: 'cod' | 'razorpay' | 'wallet'
  coupon_code?: string
}

export interface CheckoutResponse {
  orders: OrderDetail[]
  combined_grand_total: number
  razorpay: { razorpay_order_id: string; amount: number; currency: string; key: string } | null
}

export const ordersApi = {
  checkout: (payload: CheckoutPayload) =>
    api.post<CheckoutResponse>('/orders/checkout/', payload).then((r) => r.data),

  paymentMethods: () =>
    api
      .get<{ code: string; label: string; extra_fee: number; min_order_value: number | null }[]>(
        '/orders/payment-methods/'
      )
      .then((r) => r.data),

  deliveryEstimate: (addressId: string) =>
    api
      .get<{ vendor_id: string; vendor_name: string; distance_km: number | null; delivery_charge: number | null; error: string | null }[]>(
        '/orders/delivery-estimate/', { params: { address_id: addressId } }
      )
      .then((r) => r.data),

  verifyPayment: (payload: {
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
  }) => api.post<OrderDetail[]>('/orders/payments/verify/', payload).then((r) => r.data),

  validateCoupon: (code: string) =>
    api.get('/orders/coupons/validate/', { params: { code } }).then((r) => r.data),

  list: (status?: OrderStatus) =>
    api.get<Paginated<OrderListItem>>('/orders/', { params: status ? { status } : {} }).then((r) => r.data),

  detail: (id: string) => api.get<OrderDetail>(`/orders/${id}/`).then((r) => r.data),

  cancel: (id: string, reason?: string) =>
    api.post<OrderDetail>(`/orders/${id}/cancel/`, { reason }).then((r) => r.data),

  downloadInvoice: (id: string) =>
    api.get(`/orders/${id}/invoice/`, { responseType: 'blob' }).then((r) => r.data as Blob),

  track: (id: string) =>
    api
      .get<{ status: OrderStatus; order_number: string; location: { latitude: string; longitude: string } | null; websocket_url: string }>(
        `/orders/${id}/track/`
      )
      .then((r) => r.data),
}
