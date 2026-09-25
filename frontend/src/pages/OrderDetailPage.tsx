import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Circle, CreditCard, Download, MapPin, RotateCcw, Star, Wifi, WifiOff } from 'lucide-react'
import { ordersApi } from '@/api/orders'
import { apiErrorMessage } from '@/api/client'
import { openRazorpay } from '@/lib/razorpay'
import { useAuthStore } from '@/store/auth'
import { RateOrder } from '@/components/order/RateOrder'
import { useReorder } from '@/hooks/useReorder'
import { useSeo } from '@/hooks/useSeo'
import { useOrderTracking } from '@/hooks/useOrderTracking'
import { formatINR, cn } from '@/lib/utils'
import { STATUS_LABELS, STATUS_SEQUENCE } from '@/lib/orderStatus'
import { Button } from '@/components/ui/Button'
import { EtaPill } from '@/components/ui/EtaPill'
import { LiveLocationMap } from '@/components/ui/LiveLocationMap'

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data: order } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.detail(id!),
    enabled: !!id,
    refetchInterval: 30_000, // fallback polling if the socket ever drops
  })

  useSeo({ title: 'Order details', noindex: true })
  const reorder = useReorder()
  const live = useOrderTracking(id)
  const currentStatus = live.status ?? order?.status

  const cancel = useMutation({
    mutationFn: () => ordersApi.cancel(id!, 'Changed my mind'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['order', id] }),
  })

  const user = useAuthStore((s) => s.user)
  const [payError, setPayError] = useState('')
  const payNow = useMutation({
    mutationFn: () => ordersApi.retryPayment(id!),
    onMutate: () => setPayError(''),
    onSuccess: (payload) =>
      openRazorpay({
        payload,
        description: `Payment for ${order?.order_number ?? 'order'}`,
        prefill: { name: user?.full_name ?? undefined, contact: user?.phone ?? undefined, email: user?.email ?? undefined },
        onPaid: () => queryClient.invalidateQueries({ queryKey: ['order', id] }),
        onDismiss: () => undefined,
        onError: (err) =>
          setPayError(apiErrorMessage(err, 'If money was deducted, it will reflect here within a few minutes.')),
      }),
    onError: (err) => setPayError(apiErrorMessage(err, 'Could not start payment.')),
  })

  const [downloading, setDownloading] = useState(false)
  const handleDownloadBill = async () => {
    if (!id) return
    setDownloading(true)
    try {
      const blob = await ordersApi.downloadInvoice(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice_${order?.order_number ?? id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Could not download the bill. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  if (!order) return <div className="mx-auto max-w-2xl px-4 py-10 text-ink-300 animate-pulse">Loading order...</div>

  const isCancelled = currentStatus === 'cancelled'
  const currentIndex = STATUS_SEQUENCE.indexOf(currentStatus ?? order.status)
  const canCancel = !isCancelled && currentIndex <= STATUS_SEQUENCE.indexOf('accepted')
  const awaitingPayment = !isCancelled && order.payment_method === 'razorpay' && order.payment_status !== 'paid'
  const paymentLabel =
    order.payment_status === 'refunded'
      ? 'Refunded'
      : order.payment_method === 'cod'
        ? 'Cash on delivery'
        : order.payment_status === 'paid'
          ? order.payment_method === 'wallet' ? 'Paid from wallet' : 'Paid online'
          : 'Payment pending'

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink-500">{order.vendor_name}</h1>
          <p className="text-xs text-ink-300 font-mono mt-0.5">{order.order_number}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-ink-200">
          {live.connected ? <Wifi className="h-3.5 w-3.5 text-forest-600" /> : <WifiOff className="h-3.5 w-3.5" />}
          {live.connected ? 'Live' : 'Offline'}
        </div>
      </div>

      {awaitingPayment && (
        <div className="rounded-[var(--radius-card)] bg-mango-50 border border-mango-300 p-4 mb-4">
          <p className="text-sm font-semibold text-ink-500">Payment not completed</p>
          <p className="text-xs text-ink-400 mt-0.5">
            The shop will start packing once payment is done. Unpaid orders are cancelled automatically after 15 minutes.
          </p>
          <Button onClick={() => payNow.mutate()} loading={payNow.isPending} className="w-full mt-3">
            <CreditCard className="h-4 w-4" /> Pay {formatINR(order.grand_total)} now
          </Button>
          {payError && <p className="text-xs text-chili-600 mt-2">{payError}</p>}
        </div>
      )}

      {!isCancelled ? (
        <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <EtaPill minutes={currentIndex >= 4 ? 8 : 15} label="estimated" size="sm" />
          </div>
          <ol className="flex flex-col gap-3">
            {STATUS_SEQUENCE.map((status, i) => {
              const done = i <= currentIndex
              return (
                <li key={status} className="flex items-center gap-3">
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 text-forest-600 shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-ink-100 shrink-0" />
                  )}
                  <span className={cn('text-sm', done ? 'text-ink-500 font-medium' : 'text-ink-200')}>
                    {STATUS_LABELS[status]}
                  </span>
                </li>
              )
            })}
          </ol>
          {live.location && (
            <div className="mt-4 pt-4 border-t border-ink-100 flex items-center gap-2 text-xs text-ink-400">
              <MapPin className="h-4 w-4 text-forest-600" />
              Delivery partner is on the move — live location updating.
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-[var(--radius-card)] bg-chili-100 text-chili-600 p-4 mb-4 text-sm font-medium text-center">
          This order was cancelled.
        </div>
      )}

      {!isCancelled && currentStatus !== 'delivered' && order.delivery_otp && (
        <div className="rounded-[var(--radius-card)] bg-mango-50 border border-mango-100 p-4 mb-4 text-center">
          <p className="text-xs text-ink-400">Share this code with the delivery partner only after you receive your items</p>
          <p className="font-mono text-2xl font-bold tracking-[0.3em] text-ink-500 mt-1">{order.delivery_otp}</p>
        </div>
      )}

      {['pickup', 'out_for_delivery', 'nearby'].includes(currentStatus ?? '') && (
        <LiveLocationMap location={live.location} connected={live.connected} />
      )}

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 divide-y divide-ink-100/60 mb-4">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between p-3 text-sm">
            <span className="text-ink-500">
              {item.quantity} × {item.product_name}
            </span>
            <span className="font-mono text-ink-400">{formatINR(item.subtotal)}</span>
          </div>
        ))}
      </div>

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4 mb-4 space-y-2 text-sm">
        <div className="flex justify-between text-ink-400">
          <span>Subtotal</span>
          <span className="font-mono">{formatINR(order.subtotal)}</span>
        </div>
        <div className="flex justify-between text-ink-400">
          <span>Delivery</span>
          <span className="font-mono">{formatINR(order.delivery_charge)}</span>
        </div>
        {(order.extra_charges_breakdown ?? []).map((c) => (
          <div key={c.code} className="flex justify-between text-ink-400">
            <span>{c.label}</span>
            <span className="font-mono">{formatINR(c.amount)}</span>
          </div>
        ))}
        {parseFloat(order.discount_amount) > 0 && (
          <div className="flex justify-between text-forest-600">
            <span>Discount ({order.coupon_code})</span>
            <span className="font-mono">-{formatINR(order.discount_amount)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-ink-500 pt-2 border-t border-ink-100">
          <span>Total ({paymentLabel})</span>
          <span className="font-mono">{formatINR(order.grand_total)}</span>
        </div>
      </div>

      <p className="text-xs text-ink-300 mb-4">Deliver to: {order.delivery_address_text}</p>

      {currentStatus === 'delivered' && !order.rating && <RateOrder orderId={order.id} hasRider={true} />}
      {order.rating && (
        <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-3 mb-4 flex items-center gap-2 text-sm text-ink-400">
          <Star className="h-4 w-4 text-mango-500 fill-mango-500" /> You rated this order {order.rating.shop_rating}/5 — thank you!
        </div>
      )}

      {(currentStatus === 'delivered' || isCancelled) && (
        <Button onClick={() => reorder.mutate(order.id)} loading={reorder.isPending} className="w-full mb-3">
          <RotateCcw className="h-4 w-4" /> Order again
        </Button>
      )}

      <Button
        variant="ghost"
        onClick={handleDownloadBill}
        loading={downloading}
        className="w-full mb-3 flex items-center justify-center gap-2"
      >
        <Download className="h-4 w-4" /> Download bill
      </Button>

      {canCancel && (
        <Button variant="danger" onClick={() => cancel.mutate()} loading={cancel.isPending} className="w-full">
          Cancel order
        </Button>
      )}
    </div>
  )
}
