import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, Copy, Download, Phone } from 'lucide-react'
import { vendorApi } from '@/api/vendor'
import { apiErrorMessage } from '@/api/client'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { OrderStatus } from '@/types'

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'placed', label: 'New' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'packing', label: 'Packing' },
  { value: 'ready', label: 'Ready for pickup' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const REJECT_REASONS = [
  'Item(s) out of stock',
  'Shop closing now',
  'Too busy right now',
  'Address too far',
  'Other',
]

function PaymentChip({ method, status }: { method: string; status: string }) {
  if (status === 'refunded') return <span className="text-[11px] font-semibold rounded-full px-2 py-0.5 bg-ink-100 text-ink-400">Refunded</span>
  if (method === 'cod')
    return <span className="text-[11px] font-semibold rounded-full px-2 py-0.5 bg-mango-100 text-mango-600">COD</span>
  return <span className="text-[11px] font-semibold rounded-full px-2 py-0.5 bg-forest-100 text-forest-700">Paid</span>
}

const nextActionFor = (status: OrderStatus): { label: string; status: 'packing' | 'ready' } | null => {
  if (status === 'accepted') return { label: 'Start packing', status: 'packing' }
  if (status === 'packing') return { label: 'Mark ready for pickup', status: 'ready' }
  return null
}

export function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-orders', statusFilter],
    queryFn: () => vendorApi.orders(statusFilter || undefined),
    refetchInterval: 15000,
  })

  const { data: detail } = useQuery({
    queryKey: ['vendor-order-detail', expanded],
    queryFn: () => vendorApi.orderDetail(expanded!),
    enabled: !!expanded,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['vendor-orders'] })
    queryClient.invalidateQueries({ queryKey: ['vendor-order-detail'] })
  }

  const [actionError, setActionError] = useState<Record<string, string>>({})
  const showError = (id: string, err: unknown) =>
    setActionError((e) => ({ ...e, [id]: apiErrorMessage(err, 'Could not update this order.') }))
  const clearError = (id: string) => setActionError((e) => ({ ...e, [id]: '' }))

  const accept = useMutation({
    mutationFn: vendorApi.acceptOrder,
    onMutate: clearError,
    onSuccess: invalidate,
    onError: (err, id) => showError(id, err),
  })
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0])
  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => vendorApi.rejectOrder(id, reason),
    onSuccess: () => {
      invalidate()
      setRejecting(null)
    },
    onError: (err, { id }) => {
      showError(id, err)
      setRejecting(null)
    },
  })
  const advance = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'packing' | 'ready' }) => vendorApi.advanceOrderStatus(id, status),
    onMutate: ({ id }) => clearError(id),
    onSuccess: invalidate,
    onError: (err, { id }) => showError(id, err),
  })

  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const downloadBill = async (orderId: string, orderNumber: string) => {
    setDownloadingId(orderId)
    try {
      const blob = await vendorApi.downloadOrderInvoice(orderId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice_${orderNumber}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Could not download the bill. Please try again.')
    } finally {
      setDownloadingId(null)
    }
  }

  const orders = data?.results ?? []

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-ink-500">Orders</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              statusFilter === f.value ? 'bg-forest-600 text-rice-50' : 'bg-rice-100 text-ink-400'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-ink-300 animate-pulse">Loading...</p>}

      <div className="flex flex-col gap-2">
        {orders.map((order) => {
          const isOpen = expanded === order.id
          const action = nextActionFor(order.status)
          return (
            <div key={order.id} className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : order.id)}
                className="w-full flex items-center gap-3 p-3.5 text-left"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink-500">{order.order_number}</p>
                  <p className="text-xs text-ink-300">{new Date(order.placed_at).toLocaleString()}</p>
                </div>
                <span className="font-mono text-sm text-ink-500">₹{order.grand_total}</span>
                <PaymentChip method={order.payment_method} status={order.payment_status} />
                <Badge status={order.status} />
                {isOpen ? <ChevronUp className="h-4 w-4 text-ink-300" /> : <ChevronDown className="h-4 w-4 text-ink-300" />}
              </button>

              {isOpen && detail && (
                <div className="border-t border-ink-100/60 p-3.5 flex flex-col gap-3">
                  <div className="text-sm text-ink-500 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{detail.customer_name}</p>
                      <p className="text-ink-300 text-xs mt-0.5">{detail.delivery_address_text}</p>
                    </div>
                    {detail.customer_phone && (
                      <a
                        href={`tel:${detail.customer_phone}`}
                        className="flex items-center gap-1.5 text-xs font-medium text-forest-600 border border-forest-200 rounded-lg px-2.5 py-1.5 hover:bg-forest-50 shrink-0"
                      >
                        <Phone className="h-3.5 w-3.5" /> Call
                      </a>
                    )}
                  </div>

                  <div className="flex flex-col divide-y divide-ink-100/60">
                    {detail.items.map((item) => (
                      <div key={item.id} className="flex justify-between py-1.5 text-sm">
                        <span className="text-ink-500">{item.quantity} × {item.product_name}</span>
                        <span className="font-mono text-ink-400">₹{item.subtotal}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-ink-400 flex flex-col gap-0.5 border-t border-ink-100/60 pt-2">
                    <div className="flex justify-between"><span>Items</span><span className="font-mono">₹{detail.subtotal}</span></div>
                    {Number(detail.discount_amount) > 0 && (
                      <div className="flex justify-between"><span>Coupon {detail.coupon_code}</span><span className="font-mono">−₹{detail.discount_amount}</span></div>
                    )}
                    <div className="flex justify-between"><span>Delivery</span><span className="font-mono">₹{detail.delivery_charge}</span></div>
                    {(detail.extra_charges_breakdown ?? []).map((c) => (
                      <div key={c.code} className="flex justify-between"><span>{c.label}</span><span className="font-mono">₹{c.amount}</span></div>
                    ))}
                    <div className="flex justify-between font-semibold text-ink-500">
                      <span>{detail.payment_method === 'cod' ? 'Rider collects (COD)' : 'Paid online'}</span>
                      <span className="font-mono">₹{detail.grand_total}</span>
                    </div>
                  </div>

                  {detail.rating && (
                    <div className="rounded-lg bg-rice-100 p-2.5 text-sm">
                      <p className="text-ink-500">
                        Customer rated <span className="font-semibold">{'★'.repeat(detail.rating.shop_rating)}{'☆'.repeat(5 - detail.rating.shop_rating)}</span>
                      </p>
                      {detail.rating.comment && <p className="text-xs text-ink-400 mt-0.5">“{detail.rating.comment}”</p>}
                    </div>
                  )}

                  {['ready', 'pickup'].includes(detail.status) && (
                    <div className="rounded-lg bg-mango-50 border border-mango-100 p-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-ink-400">Pickup OTP — give this to the delivery partner</p>
                        <p className="font-mono text-lg font-bold text-ink-500">{detail.pickup_otp}</p>
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(detail.pickup_otp)}
                        className="text-ink-300 hover:text-forest-600"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {order.status === 'placed' && (
                      <>
                        <Button size="sm" onClick={() => accept.mutate(order.id)} loading={accept.isPending}>
                          Accept order
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setRejecting(order.id)}>
                          Reject
                        </Button>
                      </>
                    )}
                    {action && (
                      <Button
                        size="sm"
                        onClick={() => advance.mutate({ id: order.id, status: action.status })}
                        loading={advance.isPending}
                      >
                        {action.label}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => downloadBill(order.id, order.order_number)}
                      loading={downloadingId === order.id}
                      className="flex items-center gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5" /> Bill
                    </Button>
                  </div>
                  {actionError[order.id] && <p className="text-xs text-chili-600">{actionError[order.id]}</p>}
                </div>
              )}
            </div>
          )
        })}
        {data && orders.length === 0 && <p className="text-ink-300 text-center py-8">No orders here.</p>}
      </div>

      <Modal open={!!rejecting} onClose={() => setRejecting(null)} title="Why are you rejecting this order?">
        <div className="flex flex-col gap-2">
          {REJECT_REASONS.map((r) => (
            <label key={r} className="flex items-center gap-2 text-sm text-ink-500 rounded-lg border border-ink-100 p-2.5 cursor-pointer">
              <input type="radio" name="reject-reason" checked={rejectReason === r} onChange={() => setRejectReason(r)} className="accent-forest-600" />
              {r}
            </label>
          ))}
          <p className="text-xs text-ink-300">The customer is notified and any online payment is refunded automatically.</p>
          <Button
            variant="danger"
            loading={reject.isPending}
            onClick={() => rejecting && reject.mutate({ id: rejecting, reason: rejectReason })}
          >
            Reject order
          </Button>
        </div>
      </Modal>
    </div>
  )
}
