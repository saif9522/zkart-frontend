import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBasket, Star } from 'lucide-react'
import type { ProductListItem } from '@/types'
import { formatINR } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'
import { useAuthStore } from '@/store/auth'

export function ProductCard({ product }: { product: ProductListItem }) {
  const { cart, addItem, updateItem, removeItem } = useCart()
  const isAuthed = !!useAuthStore((s) => s.accessToken)
  const navigate = useNavigate()

  const cartItem = cart?.items.find((i) => i.product.id === product.id)
  const quantity = cartItem?.quantity ?? 0

  const handleAdd = () => {
    if (!isAuthed) {
      navigate('/login')
      return
    }
    addItem.mutate({ productId: product.id, product })
  }

  const handleIncrease = () => {
    if (cartItem) updateItem.mutate({ itemId: cartItem.id, quantity: cartItem.quantity + 1 })
  }

  const handleDecrease = () => {
    if (!cartItem) return
    if (cartItem.quantity <= 1) removeItem.mutate(cartItem.id)
    else updateItem.mutate({ itemId: cartItem.id, quantity: cartItem.quantity - 1 })
  }

  const [imageFailed, setImageFailed] = useState(false)

  return (
    <div className="group relative flex flex-col rounded-xl bg-rice-50 border border-ink-100/50 overflow-visible">
      <div className="relative">
        <Link to={`/product/${product.slug}`} className="block">
          <div className="relative aspect-square rounded-t-xl bg-white flex items-center justify-center overflow-hidden">
            {product.primary_image && !imageFailed ? (
              <img
                src={product.primary_image}
                alt={product.name}
                className="h-full w-full object-cover p-1.5"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <ShoppingBasket className="h-9 w-9 text-forest-400/30" />
            )}
            {!product.in_stock && (
              <div className="absolute inset-0 bg-rice-50/85 flex items-center justify-center">
                <span className="text-[11px] font-semibold text-ink-400">Out of stock</span>
              </div>
            )}
          </div>
        </Link>

        {/* ADD button floats over the bottom edge of the image, Zepto-style */}
        {product.in_stock && (
          <div className="absolute right-2 bottom-0 translate-y-1/2 z-10">
            {quantity > 0 ? (
              <div className="flex items-center gap-0 rounded-lg bg-forest-600 text-rice-50 text-xs font-bold shadow-sm overflow-hidden">
                <button onClick={handleDecrease} className="px-2 py-1.5 hover:bg-forest-700">−</button>
                <span className="px-1 font-mono min-w-[1.2rem] text-center">{quantity}</span>
                <button onClick={handleIncrease} className="px-2 py-1.5 hover:bg-forest-700">+</button>
              </div>
            ) : (
              <button
                onClick={handleAdd}
                disabled={addItem.isPending}
                className="rounded-lg bg-rice-50 border border-forest-600 text-forest-600 text-xs font-bold px-3.5 py-1.5 shadow-sm hover:bg-forest-600 hover:text-rice-50 transition-colors disabled:opacity-50"
              >
                ADD
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-0.5 px-2.5 pt-4 pb-2.5">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-sm font-bold text-ink-500">{formatINR(product.selling_price)}</span>
          {product.discount_percent > 0 && (
            <span className="font-mono text-[11px] text-ink-200 line-through">{formatINR(product.mrp)}</span>
          )}
        </div>
        {product.discount_percent > 0 && (
          <span className="text-[11px] font-semibold text-forest-600">{product.discount_percent}% OFF</span>
        )}

        <Link to={`/product/${product.slug}`}>
          <h3 className="text-xs text-ink-500 line-clamp-2 leading-snug mt-1">{product.name}</h3>
        </Link>
        <p className="text-[11px] text-ink-300">{product.unit}</p>

        {product.rating_count > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-ink-300 mt-0.5">
            <Star className="h-2.5 w-2.5 fill-forest-600 text-forest-600" />
            <span className="font-mono">{product.rating_avg}</span>
            <span>({product.rating_count})</span>
          </div>
        )}
      </div>
    </div>
  )
}
