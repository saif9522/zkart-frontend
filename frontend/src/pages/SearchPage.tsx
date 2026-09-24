import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SlidersHorizontal, X } from 'lucide-react'
import { catalogApi } from '@/api/catalog'
import { ProductCard } from '@/components/product/ProductCard'
import { cn } from '@/lib/utils'

const SORT_OPTIONS = [
  { value: '', label: 'Relevance' },
  { value: 'selling_price', label: 'Price: Low to High' },
  { value: '-selling_price', label: 'Price: High to Low' },
  { value: '-rating_avg', label: 'Rating' },
]

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const q = params.get('q') || ''
  const category = params.get('category') || ''
  const ordering = params.get('ordering') || ''

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'search', q, category, ordering],
    queryFn: () => catalogApi.products({ search: q || undefined, category: category || undefined, ordering: ordering || undefined }),
  })

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink-500">
            {q ? `Results for "${q}"` : category ? category.replace(/-/g, ' ') : 'All products'}
          </h1>
          {data && <p className="text-xs text-ink-300 mt-0.5">{data.count} items</p>}
        </div>
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-ink-100 px-3 py-2 text-sm text-ink-400"
        >
          <SlidersHorizontal className="h-4 w-4" /> Sort
        </button>
      </div>

      {filtersOpen && (
        <div className="mb-4 flex flex-wrap gap-2 rounded-xl bg-rice-50 border border-ink-100/60 p-3">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setParam('ordering', opt.value)
                setFiltersOpen(false)
              }}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full border',
                ordering === opt.value
                  ? 'bg-forest-600 text-rice-50 border-forest-600'
                  : 'border-ink-100 text-ink-400'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {category && (
        <button
          onClick={() => setParam('category', '')}
          className="mb-4 inline-flex items-center gap-1 text-xs bg-forest-50 text-forest-700 rounded-full px-3 py-1.5"
        >
          {category.replace(/-/g, ' ')} <X className="h-3 w-3" />
        </button>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4.2] rounded-[var(--radius-card)] bg-ink-100/40 animate-pulse" />
            ))
          : data?.results.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>

      {data && data.results.length === 0 && (
        <div className="text-center py-20">
          <p className="text-ink-400 font-medium">No products found.</p>
          <p className="text-sm text-ink-300 mt-1">Try a different search or browse categories on the home page.</p>
        </div>
      )}
    </div>
  )
}
