import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPin, Plus, Tag } from 'lucide-react'
import { addressApi } from '@/api/addresses'
import { ordersApi } from '@/api/orders'
import { walletApi } from '@/api/wallet'
import { apiErrorMessage } from '@/api/client'
import { useAuthStore } from '@/store/auth'
import { useCart } from '@/hooks/useCart'
import { formatINR, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void }
  }
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { cart } = useCart()

  const { data: addresses } = useQuery({ queryKey: ['addresses'], queryFn: addressApi.list })
  const [selectedAddress, setSelectedAddress] = useState<string>('')
  const { data: paymentMethods } = useQuery({ queryKey: ['payment-methods'], queryFn: ordersApi.paymentMethods })
  const { data: walletBalance } = useQuery({ queryKey: ['wallet-balance'], queryFn: walletApi.balance })
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay' | 'wallet'>('cod')

  const insufficientWalletBalance =
    walletBalance !== undefined && cart && Number(walletBalance) < Number(cart.grand_total)

  useEffect(() => {
    if (paymentMethods && paymentMethods.length > 0 && !paymentMethods.some((m) => m.code === paymentMethod)) {
      setPaymentMethod(paymentMethods[0].code as 'cod' | 'razorpay' | 'wallet')
    }
  }, [paymentMethods])
  const [couponCode, setCouponCode] = useState('')
  const [error, setError] = useState('')

  const [showAddressForm, setShowAddressForm] = useState(false)
  const [form, setForm] = useState({ address_line: '', city: 'Garhwa', pincode: '', latitude: '24.1553', longitude: '83.8099' })

  const currentAddresses = addresses ?? []
  const activeAddressId = selectedAddress || currentAddresses.find((a) => a.is_default)?.id || currentAddresses[0]?.id

  const { data: deliveryEstimate } = useQuery({
    queryKey: ['delivery-estimate', activeAddressId],
    queryFn: () => ordersApi.deliveryEstimate(activeAddressId!),
    enabled: !!activeAddressId,
  })
  const outOfRangeVendor = deliveryEstimate?.find((e) => e.error)

  const createAddress = useMutation({
    mutationFn: () =>
      addressApi.create({
        label: 'home',
        address_line: form.address_line,
        landmark: '',
        city: form.city,
        state: 'Jharkhand',
        pincode: form.pincode,
        latitude: form.latitude,
        longitude: form.longitude,
        is_default: currentAddresses.length === 0,
      }),
    onSuccess: (addr) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      setSelectedAddress(addr.id)
      setShowAddressForm(false)
    },
  })

  const user = useAuthStore((s) => s.user)

  const checkout = useMutation({
    mutationFn: () =>
      ordersApi.checkout({
        address_id: activeAddressId,
        payment_method: paymentMethod,
        coupon_code: couponCode || undefined,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      const firstOrderId = data.orders[0]?.id

      // COD orders are placed and paid-on-delivery immediately.
      if (paymentMethod === 'cod' || !data.razorpay) {
        navigate(firstOrderId ? `/orders/${firstOrderId}` : '/orders')
        return
      }

      // Razorpay: the order row already exists (payment_status=pending) —
      // open the widget now and verify the payment before treating it as placed.
      if (!window.Razorpay) {
        setError('Payment widget failed to load. Check your connection and try again.')
        return
      }

      const rzp = new window.Razorpay({
        key: data.razorpay.key,
        amount: data.razorpay.amount,
        currency: data.razorpay.currency,
        order_id: data.razorpay.razorpay_order_id,
        name: 'zKart.shop',
        description: `Order payment (${data.orders.length} shop${data.orders.length > 1 ? 's' : ''})`,
        prefill: { name: user?.full_name, contact: user?.phone, email: user?.email ?? undefined },
        theme: { color: '#1F4D3A' },
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          try {
            await ordersApi.verifyPayment(response)
            queryClient.invalidateQueries({ queryKey: ['cart'] })
            navigate(firstOrderId ? `/orders/${firstOrderId}` : '/orders')
          } catch (err) {
            setError(apiErrorMessage(err, 'Payment succeeded but verification failed. Contact support.'))
          }
        },
        modal: {
          // Order row exists but is unpaid if the customer closes the widget —
          // send them to the order so they can see its status and retry.
          ondismiss: () => {
            navigate(firstOrderId ? `/orders/${firstOrderId}` : '/orders')
          },
        },
      })
      rzp.open()
    },
    onError: (err) => setError(apiErrorMessage(err, 'Could not place your order. Please try again.')),
  })

  if (!cart || cart.items.length === 0) {
    navigate('/cart')
    return null
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <h1 className="font-display text-xl font-semibold text-ink-500 mb-4">Checkout</h1>

      {/* Address */}
      <section className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4 mb-4">
        <h2 className="text-sm font-semibold text-ink-500 flex items-center gap-1.5 mb-3">
          <MapPin className="h-4 w-4 text-forest-600" /> Delivery address
        </h2>

        <div className="flex flex-col gap-2">
          {currentAddresses.map((addr) => (
            <label
              key={addr.id}
              className={cn(
                'flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer text-sm',
                activeAddressId === addr.id ? 'border-forest-600 bg-forest-50' : 'border-ink-100'
              )}
            >
              <input
                type="radio"
                name="address"
                checked={activeAddressId === addr.id}
                onChange={() => setSelectedAddress(addr.id)}
                className="mt-1 accent-forest-600"
              />
              <div>
                <span className="font-medium text-ink-500 capitalize">{addr.label}</span>
                <p className="text-ink-300 text-xs mt-0.5">
                  {addr.address_line}, {addr.city} - {addr.pincode}
                </p>
              </div>
            </label>
          ))}

          {showAddressForm ? (
            <div className="rounded-xl border border-ink-100 p-3 flex flex-col gap-2">
              <input
                placeholder="House no., street, area"
                value={form.address_line}
                onChange={(e) => setForm({ ...form, address_line: e.target.value })}
                className="rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-forest-400"
              />
              <div className="flex gap-2">
                <input
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="flex-1 rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-forest-400"
                />
                <input
                  placeholder="Pincode"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  className="w-28 rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-forest-400"
                />
              </div>
              <Button
                size="sm"
                onClick={() => createAddress.mutate()}
                loading={createAddress.isPending}
                disabled={!form.address_line || !form.pincode}
              >
                Save address
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddressForm(true)}
              className="flex items-center gap-1.5 text-sm text-forest-600 font-medium py-1"
            >
              <Plus className="h-4 w-4" /> Add new address
            </button>
          )}
        </div>
      </section>

      {/* Coupon */}
      <section className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4 mb-4">
        <h2 className="text-sm font-semibold text-ink-500 flex items-center gap-1.5 mb-3">
          <Tag className="h-4 w-4 text-forest-600" /> Coupon code
        </h2>
        <input
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          placeholder="e.g. WELCOME50"
          className="w-full rounded-lg border border-ink-100 px-3 py-2 text-sm font-mono outline-none focus:border-forest-400"
        />
      </section>

      {/* Payment */}
      <section className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4 mb-4">
        <h2 className="text-sm font-semibold text-ink-500 mb-3">Payment method</h2>
        <div className="flex flex-col gap-2">
          {(paymentMethods ?? []).map((opt) => {
            const isWalletInsufficient = opt.code === 'wallet' && insufficientWalletBalance
            return (
              <label
                key={opt.code}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl border p-3 text-sm',
                  isWalletInsufficient ? 'border-ink-100 opacity-50 cursor-not-allowed' : 'cursor-pointer',
                  paymentMethod === opt.code && !isWalletInsufficient ? 'border-forest-600 bg-forest-50' : 'border-ink-100'
                )}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === opt.code}
                  disabled={isWalletInsufficient}
                  onChange={() => setPaymentMethod(opt.code as 'cod' | 'razorpay' | 'wallet')}
                  className="accent-forest-600"
                />
                <div className="flex-1">
                  <span>{opt.label}</span>
                  {opt.code === 'wallet' && walletBalance !== undefined && (
                    <span className="text-xs text-ink-300 ml-1.5">(Balance: {formatINR(walletBalance)})</span>
                  )}
                  {opt.extra_fee > 0 && <span className="text-xs text-ink-300 ml-1.5">(+{formatINR(opt.extra_fee)} fee)</span>}
                  {opt.min_order_value && (
                    <p className="text-xs text-ink-300">Minimum order {formatINR(opt.min_order_value)}</p>
                  )}
                  {isWalletInsufficient && <p className="text-xs text-chili-600">Not enough wallet balance</p>}
                </div>
              </label>
            )
          })}
          {paymentMethods && paymentMethods.length === 0 && (
            <p className="text-sm text-chili-600">No payment methods are available right now. Please try again later.</p>
          )}
        </div>
      </section>

      {/* Summary */}
      <section className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4 mb-4 space-y-2">
        <div className="flex justify-between text-sm text-ink-400">
          <span>Subtotal</span>
          <span className="font-mono">{formatINR(cart.subtotal)}</span>
        </div>
        {deliveryEstimate && deliveryEstimate.length > 0 ? (
          deliveryEstimate.map((e) => (
            <div key={e.vendor_id} className="flex justify-between text-sm text-ink-400">
              <span>
                Delivery — {e.vendor_name}
                {e.distance_km !== null && <span className="text-xs text-ink-300"> ({e.distance_km} km)</span>}
              </span>
              <span className="font-mono">
                {e.error ? '—' : e.delivery_charge === 0 ? 'FREE' : formatINR(e.delivery_charge!)}
              </span>
            </div>
          ))
        ) : (
          <div className="flex justify-between text-sm text-ink-400">
            <span>Delivery</span>
            <span className="font-mono">{cart.delivery_charge === 0 ? 'FREE' : formatINR(cart.delivery_charge)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-semibold text-ink-500 pt-2 border-t border-ink-100">
          <span>Total</span>
          <span className="font-mono">{formatINR(cart.grand_total)}</span>
        </div>
      </section>

      {outOfRangeVendor && (
        <div className="rounded-xl bg-chili-100 text-chili-600 p-3 mb-4 text-sm">{outOfRangeVendor.error}</div>
      )}

      {error && <p className="text-sm text-chili-600 mb-3">{error}</p>}

      <Button
        onClick={() => checkout.mutate()}
        loading={checkout.isPending}
        disabled={!activeAddressId || !!outOfRangeVendor}
        size="lg"
        className="w-full"
      >
        Place order
      </Button>
    </div>
  )
}
