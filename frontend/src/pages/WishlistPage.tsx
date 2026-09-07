import { Link, useNavigate } from 'react-router-dom'
import { Heart, ShoppingBasket, Trash2 } from 'lucide-react'
import { useWishlist } from '@/hooks/useWishlist'
import { useCart } from '@/hooks/useCart'
import { useAuthStore } from '@/store/auth'
import { formatINR } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

export function WishlistPage() {
  const isAuthed = !!useAuthStore((s) => s.accessToken)
  const navigate = useNavigate()
  const { items, isLoading, remove } = useWishlist()
  const { addItem } = useCart()

  if (!isAuthed) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <Heart className="h-12 w-12 text-ink-200 mx-auto" />
        <p className="text-ink-400 font-medium mt-4">Log in to see your wishlist</p>
        <Button onClick={() => navigate('/login')} className="mt-4">
          Log in
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return <div className="mx-auto max-w-2xl px-4 py-10 text-ink-300 animate-pulse">Loading your wishlist...</div>
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <Heart className="h-12 w-12 text-ink-200 mx-auto" />
        <p className="text-ink-400 font-medium mt-4">Your wishlist is empty</p>
        <p className="text-sm text-ink-300 mt-1">Tap the heart on any product to save it here.</p>
        <Link to="/">
          <Button className="mt-4">Start shopping</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <h1 className="font-display text-xl font-semibold text-ink-500 mb-4">Your wishlist</h1>

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 divide-y divide-ink-100/60 overflow-hidden">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-3">
            <Link to={`/product/${item.product.slug}`} className="h-16 w-16 rounded-lg bg-forest-50 flex items-center justify-center shrink-0 overflow-hidden">
              {item.product.primary_image ? (
                <img src={item.product.primary_image} alt="" className="h-full w-full object-cover" />
              ) : (
                <ShoppingBasket className="h-6 w-6 text-forest-400/40" />
              )}
            </Link>
            <Link to={`/product/${item.product.slug}`} className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink-500 truncate">{item.product.name}</p>
              <p className="text-xs text-ink-300">{item.product.unit}</p>
              <p className="font-mono text-sm font-semibold text-ink-500 mt-1">{formatINR(item.product.selling_price)}</p>
            </Link>
            <div className="flex flex-col items-end gap-2">
              <button onClick={() => remove.mutate(item.id)} className="text-ink-200 hover:text-chili-500">
                <Trash2 className="h-4 w-4" />
              </button>
              <Button
                size="sm"
                variant="secondary"
                disabled={!item.product.in_stock}
                onClick={() => addItem.mutate({ productId: item.product.id })}
              >
                {item.product.in_stock ? 'Add to cart' : 'Out of stock'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
