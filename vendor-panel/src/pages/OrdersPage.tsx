import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, Copy, Download, Phone } from 'lucide-react'
import { vendorApi } from '@/api/vendor'
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

  const accept = useMutation({ mutationFn: vendorApi.acceptOrder, onSuccess: invalidate })
  const reject = useMutation({
    mutationFn: (id: string) => vendorApi.rejectOrder(id, 'Unable to fulfill'),
    onSuccess: invalidate,
  })
  const advance = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'packing' | 'ready' }) => vendorApi.advanceOrderStatus(id, status),
    onSuccess: invalidate,
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
                        <Button size="sm" variant="danger" onClick={() => reject.mutate(order.id)} loading={reject.isPending}>
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
                </div>
              )}
            </div>
          )
        })}
        {data && orders.length === 0 && <p className="text-ink-300 text-center py-8">No orders here.</p>}
      </div>
    </div>
  )
}
