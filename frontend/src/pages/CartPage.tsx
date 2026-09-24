import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBasket, Trash2 } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { formatINR } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import { EtaPill } from '@/components/ui/EtaPill'
import { useAuthStore } from '@/store/auth'

export function CartPage() {
  const isAuthed = !!useAuthStore((s) => s.accessToken)
  const navigate = useNavigate()
  const { cart, isLoading, updateItem, removeItem } = useCart()

  if (!isAuthed) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <ShoppingBasket className="h-12 w-12 text-ink-200 mx-auto" />
        <p className="text-ink-400 font-medium mt-4">Log in to see your cart</p>
        <Button onClick={() => navigate('/login')} className="mt-4">
          Log in
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return <div className="mx-auto max-w-2xl px-4 py-10 text-ink-300 animate-pulse">Loading your cart...</div>
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <ShoppingBasket className="h-12 w-12 text-ink-200 mx-auto" />
        <p className="text-ink-400 font-medium mt-4">Your cart is empty</p>
        <p className="text-sm text-ink-300 mt-1">Add something tasty from the home page.</p>
        <Link to="/">
          <Button className="mt-4">Start shopping</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-xl font-semibold text-ink-500">Your cart</h1>
        <EtaPill minutes={12} size="sm" />
      </div>

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 divide-y divide-ink-100/60 overflow-hidden">
        {cart.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-3">
            <div className="h-16 w-16 rounded-lg bg-forest-50 flex items-center justify-center shrink-0 overflow-hidden">
              {item.product.primary_image ? (
                <img src={item.product.primary_image} alt="" className="h-full w-full object-cover" />
              ) : (
                <ShoppingBasket className="h-6 w-6 text-forest-400/40" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink-500 truncate">{item.product.name}</p>
              <p className="text-xs text-ink-300">{item.product.unit}</p>
              <p className="font-mono text-sm font-semibold text-ink-500 mt-1">{formatINR(item.subtotal)}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button onClick={() => removeItem.mutate(item.id)} className="text-ink-200 hover:text-chili-500">
                <Trash2 className="h-4 w-4" />
              </button>
              <QuantityStepper
                quantity={item.quantity}
                size="sm"
                onIncrease={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                onDecrease={() =>
                  item.quantity <= 1
                    ? removeItem.mutate(item.id)
                    : updateItem.mutate({ itemId: item.id, quantity: item.quantity - 1 })
                }
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4 space-y-2">
        <div className="flex justify-between text-sm text-ink-400">
          <span>Subtotal</span>
          <span className="font-mono">{formatINR(cart.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-ink-400">
          <span>Delivery charge</span>
          <span className="font-mono">{cart.delivery_charge === 0 ? 'FREE' : formatINR(cart.delivery_charge)}</span>
        </div>
        <div className="flex justify-between text-base font-semibold text-ink-500 pt-2 border-t border-ink-100">
          <span>Total</span>
          <span className="font-mono">{formatINR(cart.grand_total)}</span>
        </div>
      </div>

      <Button onClick={() => navigate('/checkout')} size="lg" className="w-full mt-4">
        Proceed to checkout
      </Button>
    </div>
  )
}
