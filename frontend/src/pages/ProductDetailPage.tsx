import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { ShoppingBasket, Star, Truck, RotateCcw, ChevronRight, Heart } from 'lucide-react'
import { catalogApi } from '@/api/catalog'
import { formatINR } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import { ProductCard } from '@/components/product/ProductCard'
import { ReviewsSection } from '@/components/product/ReviewsSection'
import { ProductCarousel } from '@/components/product/ProductCarousel'
import { useCart } from '@/hooks/useCart'
import { useWishlist } from '@/hooks/useWishlist'
import { useAuthStore } from '@/store/auth'

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const isAuthed = !!useAuthStore((s) => s.accessToken)
  const [activeImage, setActiveImage] = useState(0)
  const [imageFailed, setImageFailed] = useState(false)

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => catalogApi.productDetail(slug!),
    enabled: !!slug,
  })

  const { data: similar } = useQuery({
    queryKey: ['product-similar', slug],
    queryFn: () => catalogApi.similar(slug!),
    enabled: !!slug,
  })

  const { data: frequentlyBoughtTogether } = useQuery({
    queryKey: ['product-fbt', slug],
    queryFn: () => catalogApi.frequentlyBoughtTogether(slug!),
    enabled: !!slug,
  })

  const { cart, addItem, updateItem, removeItem } = useCart()
  const cartItem = cart?.items.find((i) => i.product.id === product?.id)
  const quantity = cartItem?.quantity ?? 0

  const { isWishlisted, toggle: toggleWishlist } = useWishlist()

  const handleWishlistToggle = () => {
    if (!isAuthed) {
      navigate('/login')
      return
    }
    if (product) toggleWishlist(product.id)
  }

  if (isLoading) {
    return <div className="mx-auto max-w-5xl px-4 py-10 animate-pulse text-ink-300">Loading...</div>
  }
  if (!product) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <p className="text-ink-400 font-medium">Product not found.</p>
      </div>
    )
  }

  const handleAdd = () => {
    if (!isAuthed) {
      navigate('/login')
      return
    }
    addItem.mutate({ productId: product.id })
  }

  // Zepto-style highlights table — only rows we actually have data for.
  const highlights: [string, string][] = [
    ...(product.brand_name ? [['Brand', product.brand_name] as [string, string]] : []),
    ['Product Type', product.category_name],
    ['Unit', product.unit],
    ...(product.sku ? [['SKU', product.sku] as [string, string]] : []),
    ...(product.nutrition_info
      ? Object.entries(product.nutrition_info).map(
          ([k, v]) => [k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), String(v)] as [string, string]
        )
      : []),
    ...(product.tags?.length ? [['Tags', product.tags.join(', ')] as [string, string]] : []),
    ...product.attributes.map((a) => [a.name, a.value] as [string, string]),
  ]

  const infoRows: [string, string][] = [
    ...(product.seller_business_name ? [['Seller Name', product.seller_business_name] as [string, string]] : [['Seller Name', product.vendor_name] as [string, string]]),
    ...(product.seller_address ? [['Seller Address', product.seller_address] as [string, string]] : []),
    ...(product.seller_license_number ? [['Seller License No.', product.seller_license_number] as [string, string]] : []),
    ...(product.manufacturer_or_marketer ? [['Manufacturer Or Marketer Name', product.manufacturer_or_marketer] as [string, string]] : []),
    ...(product.country_of_origin ? [['Country Of Origin', product.country_of_origin] as [string, string]] : []),
    ...(product.shelf_life ? [['Shelf Life', product.shelf_life] as [string, string]] : []),
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-ink-300 mb-4 flex-wrap">
        <Link to="/" className="hover:text-forest-600">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link to={`/search?category=${product.category_slug}`} className="hover:text-forest-600">
          {product.category_name}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-ink-400">{product.name}</span>
      </nav>

      <div className="grid sm:grid-cols-2 gap-8">
        <div>
          <div className="aspect-square rounded-[var(--radius-card)] bg-forest-50 flex items-center justify-center overflow-hidden">
            {product.images.length > 0 && !imageFailed ? (
              <img
                src={product.images[activeImage].image}
                alt={product.name}
                className="h-full w-full object-cover"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <ShoppingBasket className="h-16 w-16 text-forest-400/40" />
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 mt-3">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => { setActiveImage(i); setImageFailed(false) }}
                  className={`h-14 w-14 rounded-lg overflow-hidden border-2 ${i === activeImage ? 'border-forest-600' : 'border-transparent'}`}
                >
                  <img src={img.image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              {product.vendor_name && <p className="text-xs text-ink-300">{product.vendor_name}</p>}
              <h1 className="font-display text-2xl font-semibold text-ink-500 mt-1">{product.name}</h1>
            </div>
            <button
              onClick={handleWishlistToggle}
              aria-label={isWishlisted(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
              className="shrink-0 h-10 w-10 rounded-full border border-ink-100 flex items-center justify-center hover:border-chili-300"
            >
              <Heart
                className={`h-5 w-5 ${isWishlisted(product.id) ? 'fill-chili-500 text-chili-500' : 'text-ink-300'}`}
              />
            </button>
          </div>
          <p className="text-sm text-ink-300 mt-1">{product.unit}</p>

          {product.rating_count > 0 && (
            <div className="flex items-center gap-1 text-sm text-ink-400 mt-2">
              <Star className="h-4 w-4 fill-mango-500 text-mango-500" />
              <span className="font-mono">{product.rating_avg}</span>
              <span className="text-ink-300">({product.rating_count} ratings)</span>
            </div>
          )}

          <div className="flex items-baseline gap-2 mt-4">
            <span className="font-mono text-2xl font-bold text-ink-500">{formatINR(product.selling_price)}</span>
            {product.discount_percent > 0 && (
              <>
                <span className="font-mono text-sm text-ink-200 line-through">{formatINR(product.mrp)}</span>
                <span className="text-sm font-semibold text-chili-600">{product.discount_percent}% off</span>
              </>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <div className="flex items-center gap-1.5 rounded-lg border border-ink-100 px-3 py-2 text-xs text-ink-400">
              <Truck className="h-3.5 w-3.5 text-forest-600" /> Fast delivery
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-ink-100 px-3 py-2 text-xs text-ink-400">
              <RotateCcw className="h-3.5 w-3.5 text-forest-600" /> Easy returns
            </div>
          </div>

          <div className="mt-6">
            {!product.in_stock ? (
              <div className="rounded-xl bg-ink-100/40 text-ink-400 text-sm font-medium px-4 py-3 text-center">
                Currently out of stock
              </div>
            ) : quantity > 0 ? (
              <div className="flex items-center gap-3">
                <QuantityStepper
                  quantity={quantity}
                  onIncrease={() => cartItem && updateItem.mutate({ itemId: cartItem.id, quantity: cartItem.quantity + 1 })}
                  onDecrease={() =>
                    cartItem &&
                    (cartItem.quantity <= 1
                      ? removeItem.mutate(cartItem.id)
                      : updateItem.mutate({ itemId: cartItem.id, quantity: cartItem.quantity - 1 }))
                  }
                />
                <span className="text-sm text-ink-300">in your cart</span>
              </div>
            ) : (
              <Button onClick={handleAdd} loading={addItem.isPending} size="lg" className="w-full sm:w-auto">
                Add to cart
              </Button>
            )}
          </div>

          {product.description && (
            <div className="mt-8 rounded-[var(--radius-card)] border border-ink-100/60 bg-rice-50 p-4">
              <h2 className="text-sm font-semibold text-ink-500 mb-3">Description</h2>
              <p className="text-sm text-ink-400 whitespace-pre-line leading-relaxed">{product.description}</p>
            </div>
          )}

          {highlights.length > 0 && (
            <div className="mt-4 rounded-[var(--radius-card)] border border-ink-100/60 bg-rice-50 p-4">
              <h2 className="text-sm font-semibold text-ink-500 mb-3">Highlights</h2>
              <dl className="flex flex-col divide-y divide-ink-100/60">
                {highlights.map(([label, value]) => (
                  <div key={label} className="grid grid-cols-2 gap-3 py-2 text-sm">
                    <dt className="text-ink-300">{label}</dt>
                    <dd className="text-ink-500">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {infoRows.length > 0 && (
            <div className="mt-4 rounded-[var(--radius-card)] border border-ink-100/60 bg-rice-50 p-4">
              <h2 className="text-sm font-semibold text-ink-500 mb-3">Information</h2>
              <dl className="flex flex-col divide-y divide-ink-100/60">
                {infoRows.map(([label, value]) => (
                  <div key={label} className="grid grid-cols-2 gap-3 py-2 text-sm">
                    <dt className="text-ink-300">{label}</dt>
                    <dd className="text-ink-500">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {product.variants.length > 0 && (
            <div className="mt-4 rounded-[var(--radius-card)] border border-ink-100/60 bg-rice-50 p-4">
              <h2 className="text-sm font-semibold text-ink-500 mb-3">Other options from this seller</h2>
              <div className="flex flex-col divide-y divide-ink-100/60">
                {product.variants.map((v) => (
                  <div key={v.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-ink-500">{v.name}</span>
                    <span className={v.in_stock ? 'text-ink-500 font-mono' : 'text-ink-300'}>
                      {v.in_stock ? formatINR(v.selling_price) : 'Out of stock'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {product.more_from_vendor.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl font-semibold text-ink-500">More from {product.vendor_name}</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
            {product.more_from_vendor.map((p) => (
              <div key={p.id} className="w-40 shrink-0">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {frequentlyBoughtTogether && frequentlyBoughtTogether.length > 0 && (
        <ProductCarousel title="Frequently bought together" products={frequentlyBoughtTogether} />
      )}
      {similar && similar.length > 0 && <ProductCarousel title="Similar products" products={similar} />}

      <ReviewsSection productId={product.id} />

      {product.similar_products.length > 0 && (
        <section className="mt-10 mb-8">
          <h2 className="font-display text-xl font-semibold text-ink-500 mb-3">Similar products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {product.similar_products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
