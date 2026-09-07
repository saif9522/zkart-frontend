import { ProductCard } from '@/components/product/ProductCard'
import type { ProductListItem } from '@/types'

export function ProductCarousel({ title, products }: { title: string; products: ProductListItem[] }) {
  if (products.length === 0) return null

  return (
    <div className="mt-6">
      <h2 className="font-display text-lg font-semibold text-ink-500 mb-3">{title}</h2>
      <div className="flex gap-3 overflow-x-auto pb-5 -mx-4 px-4 scrollbar-thin">
        {products.map((p) => (
          <div key={p.id} className="w-40 shrink-0">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  )
}
