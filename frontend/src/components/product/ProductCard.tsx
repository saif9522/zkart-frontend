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
    <div className="group relative flex flex-col h-full">
      {/* Photo box — ADD sits inside its bottom-right corner (Zepto-style) */}
      <div className="relative">
        <Link to={`/product/${product.slug}`} className="block">
          <div className="relative aspect-square rounded-xl bg-[#F5F5F7] border border-ink-100/40 flex items-center justify-center overflow-hidden">
            {product.primary_image && !imageFailed ? (
              <img
                src={product.primary_image}
                alt={product.name}
                loading="lazy"
                className="h-full w-full object-contain p-2 mix-blend-multiply transition-transform duration-200 group-hover:scale-[1.03]"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <ShoppingBasket className="h-9 w-9 text-forest-400/30" />
            )}
            {product.discount_percent > 0 && product.in_stock && (
              <span className="absolute top-0 left-0 rounded-br-lg rounded-tl-xl bg-forest-600 text-rice-50 text-[10px] font-bold px-1.5 py-0.5">
                {product.discount_percent}% OFF
              </span>
            )}
            {product.vendor_is_open === false && product.in_stock && (
              <span className="absolute top-1.5 right-1.5 rounded-md bg-ink-500/80 text-rice-50 text-[10px] font-semibold px-1.5 py-0.5">
                Shop closed
              </span>
            )}
            {!product.in_stock && (
              <div className="absolute inset-0 bg-rice-50/80 flex items-center justify-center">
                <span className="text-[11px] font-semibold text-ink-400 bg-rice-50 rounded px-2 py-0.5 border border-ink-100">Out of stock</span>
              </div>
            )}
          </div>
        </Link>

        {product.in_stock && (
          <div className="absolute right-1.5 bottom-1.5 z-10">
            {quantity > 0 ? (
              <div className="flex items-center rounded-lg bg-[#EF4372] text-rice-50 text-xs font-bold shadow-md overflow-hidden h-8">
                <button onClick={handleDecrease} className="w-7 h-full hover:bg-black/10" aria-label="Decrease">−</button>
                <span className="min-w-[1.1rem] text-center tabular-nums">{quantity}</span>
                <button onClick={handleIncrease} className="w-7 h-full hover:bg-black/10" aria-label="Increase">+</button>
              </div>
            ) : (
              <button
                onClick={handleAdd}
                disabled={addItem.isPending}
                className="h-8 rounded-lg bg-white border border-[#EF4372] text-[#EF4372] text-xs font-extrabold px-4 shadow-md hover:bg-[#FFF0F4] transition-colors disabled:opacity-50"
              >
                ADD
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 pt-2 px-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="rounded-md bg-[#0C831F] text-white text-[13px] font-bold px-1.5 py-0.5 leading-tight tabular-nums">
            {formatINR(product.selling_price)}
          </span>
          {product.discount_percent > 0 && (
            <span className="text-[12px] text-ink-300 line-through tabular-nums">{formatINR(product.mrp)}</span>
          )}
        </div>

        <Link to={`/product/${product.slug}`}>
          <h3 className="text-[13px] font-semibold text-ink-500 line-clamp-2 leading-snug">{product.name}</h3>
        </Link>
        <p className="text-[12px] text-ink-300">{product.unit}</p>

        {product.rating_count > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-ink-300">
            <Star className="h-2.5 w-2.5 fill-[#0C831F] text-[#0C831F]" />
            <span className="tabular-nums">{product.rating_avg}</span>
            <span>({product.rating_count})</span>
          </div>
        )}
      </div>
    </div>
  )
}
