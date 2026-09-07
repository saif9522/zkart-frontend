import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPin, Navigation, Package, Phone, Radio } from 'lucide-react'
import { deliveryApi } from '@/api/delivery'
import { apiErrorMessage } from '@/api/client'
import { useLocationSharing } from '@/hooks/useLocationSharing'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { MyDeliveryOrder, OrderStatus } from '@/types'

const nextActionFor = (status: OrderStatus) => {
  if (status === 'pickup') return { label: 'Start delivery', action: 'start' as const }
  if (status === 'out_for_delivery') return { label: "Mark I'm nearby", action: 'nearby' as const }
  return null
}

export function OrdersPage() {
  const [tab, setTab] = useState<'available' | 'active' | 'history'>('available')
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({})
  const [orderError, setOrderError] = useState<Record<string, string>>({})
  const queryClient = useQueryClient()

  const { data: available, isLoading: availableLoading } = useQuery({
    queryKey: ['available-orders'],
    queryFn: deliveryApi.availableOrders,
    enabled: tab === 'available',
    refetchInterval: 10000,
  })

  const { data: active, isLoading: activeLoading } = useQuery({
    queryKey: ['my-orders-active'],
    queryFn: () => deliveryApi.myOrders(),
    refetchInterval: 10000,
  })

  const hasTrackableDelivery = (active ?? []).some((o) => ['pickup', 'out_for_delivery', 'nearby'].includes(o.status))
  const locationSharing = useLocationSharing(hasTrackableDelivery)

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['my-orders-history'],
    queryFn: () => deliveryApi.myOrders('delivered'),
    enabled: tab === 'history',
  })

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['available-orders'] })
    queryClient.invalidateQueries({ queryKey: ['my-orders-active'] })
    queryClient.invalidateQueries({ queryKey: ['delivery-dashboard'] })
  }

  const setErr = (orderId: string, message: string) => setOrderError((e) => ({ ...e, [orderId]: message }))

  const claim = useMutation({
    mutationFn: deliveryApi.claimOrder,
    onSuccess: () => {
      invalidateAll()
      setTab('active')
    },
    onError: (err, orderId) => setErr(orderId, apiErrorMessage(err, 'Could not claim this order.')),
  })

  const confirmPickup = useMutation({
    mutationFn: ({ id, otp }: { id: string; otp: string }) => deliveryApi.confirmPickup(id, otp),
    onSuccess: invalidateAll,
    onError: (err, { id }) => setErr(id, apiErrorMessage(err, 'Incorrect or expired OTP.')),
  })

  const startDelivery = useMutation({
    mutationFn: deliveryApi.startDelivery,
    onSuccess: invalidateAll,
    onError: (err, orderId) => setErr(orderId, apiErrorMessage(err, 'Could not update status.')),
  })

  const markNearby = useMutation({
    mutationFn: deliveryApi.markNearby,
    onSuccess: invalidateAll,
    onError: (err, orderId) => setErr(orderId, apiErrorMessage(err, 'Could not update status.')),
  })

  const confirmDelivery = useMutation({
    mutationFn: ({ id, otp }: { id: string; otp: string }) => deliveryApi.confirmDelivery(id, otp),
    onSuccess: invalidateAll,
    onError: (err, { id }) => setErr(id, apiErrorMessage(err, 'Incorrect or expired OTP.')),
  })

  const renderActiveOrder = (order: MyDeliveryOrder) => {
    const action = nextActionFor(order.status)
    return (
      <div key={order.id} className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-3.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink-500">{order.order_number}</p>
          <Badge status={order.status} />
        </div>
        <div className="text-sm text-ink-400">
          <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0" /> {order.vendor_name} — {order.vendor_address}</p>
          <p className="flex items-center gap-1.5 mt-1"><Navigation className="h-3.5 w-3.5 shrink-0" /> {order.delivery_address_text}</p>
        </div>
        <div className="flex gap-2">
          <a
            href={`tel:${order.vendor_phone}`}
            className="flex items-center gap-1.5 text-xs font-medium text-forest-600 border border-forest-200 rounded-lg px-2.5 py-1.5 hover:bg-forest-50"
          >
            <Phone className="h-3.5 w-3.5" /> Call shop
          </a>
          <a
            href={`tel:${order.customer_phone}`}
            className="flex items-center gap-1.5 text-xs font-medium text-forest-600 border border-forest-200 rounded-lg px-2.5 py-1.5 hover:bg-forest-50"
          >
            <Phone className="h-3.5 w-3.5" /> Call {order.customer_name || 'customer'}
          </a>
        </div>
        <div className="flex items-center justify-between text-xs text-ink-300">
          <span>{order.item_count} items</span>
          <span className="font-mono text-ink-500">₹{order.grand_total}</span>
          <span>{order.payment_method === 'cod' ? 'Collect COD' : 'Prepaid'}</span>
        </div>

        {order.status === 'ready' && (
          <div className="flex gap-2 items-center">
            <input
              placeholder="Pickup OTP from vendor"
              value={otpInputs[order.id] ?? ''}
              onChange={(e) => setOtpInputs({ ...otpInputs, [order.id]: e.target.value })}
              className="flex-1 rounded-lg border border-ink-100 px-2.5 py-1.5 text-sm outline-none focus:border-forest-400"
            />
            <Button
              size="sm"
              onClick={() => confirmPickup.mutate({ id: order.id, otp: otpInputs[order.id] ?? '' })}
              loading={confirmPickup.isPending}
            >
              Confirm pickup
            </Button>
          </div>
        )}

        {action && (
          <Button
            size="sm"
            onClick={() => (action.action === 'start' ? startDelivery.mutate(order.id) : markNearby.mutate(order.id))}
            loading={startDelivery.isPending || markNearby.isPending}
          >
            {action.label}
          </Button>
        )}

        {order.status === 'nearby' && (
          <div className="flex gap-2 items-center">
            <input
              placeholder="Delivery OTP from customer"
              value={otpInputs[order.id] ?? ''}
              onChange={(e) => setOtpInputs({ ...otpInputs, [order.id]: e.target.value })}
              className="flex-1 rounded-lg border border-ink-100 px-2.5 py-1.5 text-sm outline-none focus:border-forest-400"
            />
            <Button
              size="sm"
              onClick={() => confirmDelivery.mutate({ id: order.id, otp: otpInputs[order.id] ?? '' })}
              loading={confirmDelivery.isPending}
            >
              Confirm delivery
            </Button>
          </div>
        )}

        {orderError[order.id] && <p className="text-xs text-chili-600">{orderError[order.id]}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-ink-500">Orders</h1>

      {hasTrackableDelivery && (
        <div className={`flex items-center gap-1.5 text-xs ${locationSharing.sharing ? 'text-forest-600' : 'text-mango-600'}`}>
          <Radio className="h-3.5 w-3.5" />
          {locationSharing.error
            ? locationSharing.error
            : locationSharing.sharing
              ? 'Sharing your live location with the customer'
              : 'Turning on location sharing...'}
        </div>
      )}

      <div className="flex gap-2">
        {(['available', 'active', 'history'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-forest-600 text-rice-50' : 'bg-rice-100 text-ink-400'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'available' && (
        <div className="flex flex-col gap-3">
          {availableLoading && <p className="text-ink-300 animate-pulse">Loading...</p>}
          {(available ?? []).map((order) => (
            <div key={order.id} className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-3.5 flex flex-col gap-2">
              <p className="text-sm font-semibold text-ink-500">{order.order_number}</p>
              <p className="text-sm text-ink-400 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" /> {order.vendor_name} — {order.vendor_address}
              </p>
              <a
                href={`tel:${order.vendor_phone}`}
                className="self-start flex items-center gap-1.5 text-xs font-medium text-forest-600 border border-forest-200 rounded-lg px-2.5 py-1.5 hover:bg-forest-50"
              >
                <Phone className="h-3.5 w-3.5" /> Call shop
              </a>
              <div className="flex items-center justify-between text-xs text-ink-300">
                <span>{order.item_count} items</span>
                <span className="font-mono text-ink-500">₹{order.grand_total}</span>
              </div>
              <Button size="sm" onClick={() => claim.mutate(order.id)} loading={claim.isPending} className="self-start">
                Claim this order
              </Button>
              {orderError[order.id] && <p className="text-xs text-chili-600">{orderError[order.id]}</p>}
            </div>
          ))}
          {available && available.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-10 w-10 text-ink-200 mx-auto" />
              <p className="text-ink-300 mt-2 text-sm">No orders available right now.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'active' && (
        <div className="flex flex-col gap-3">
          {activeLoading && <p className="text-ink-300 animate-pulse">Loading...</p>}
          {(active ?? []).filter((o) => !['delivered', 'cancelled'].includes(o.status)).map(renderActiveOrder)}
          {active && active.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length === 0 && (
            <p className="text-ink-300 text-center py-8">No active deliveries. Claim one from the Available tab.</p>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 divide-y divide-ink-100/60">
          {historyLoading && <p className="text-ink-300 animate-pulse p-4">Loading...</p>}
          {(history ?? []).map((order) => (
            <div key={order.id} className="flex items-center justify-between p-3.5">
              <div>
                <p className="text-sm font-medium text-ink-500">{order.order_number}</p>
                <p className="text-xs text-ink-300">{order.vendor_name} · {new Date(order.placed_at).toLocaleDateString()}</p>
              </div>
              <span className="font-mono text-sm text-ink-500">₹{order.grand_total}</span>
            </div>
          ))}
          {history && history.length === 0 && <p className="text-ink-300 text-center py-8">No delivered orders yet.</p>}
        </div>
      )}
    </div>
  )
}
