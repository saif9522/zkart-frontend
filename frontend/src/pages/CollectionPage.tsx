import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { marketingApi } from '@/api/marketing'
import { ProductCard } from '@/components/product/ProductCard'
import { useSeo } from '@/hooks/useSeo'

/** "See All" for a homepage section (Trending, Best sellers, New arrivals…). */
export function CollectionPage() {
  const { id } = useParams<{ id: string }>()
  const { data: section, isLoading, isError } = useQuery({
    queryKey: ['home-section', id],
    queryFn: () => marketingApi.homeSection(id!),
    enabled: !!id,
  })
  useSeo({ title: section?.title, description: section?.subtitle })

  if (isLoading) return <div className="mx-auto max-w-6xl px-4 py-8 text-ink-300 animate-pulse">Loading…</div>
  if (isError || !section)
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="text-ink-400">This section isn't available right now.</p>
        <Link to="/" className="text-forest-600 font-semibold text-sm mt-2 inline-block">Back to home</Link>
      </div>
    )

  return (
    <div className="mx-auto max-w-6xl px-4 py-4">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-ink-400 mb-3">
        <ChevronLeft className="h-4 w-4" /> Home
      </Link>
      <h1 className="font-display text-2xl font-semibold text-ink-500">{section.title}</h1>
      {section.subtitle && <p className="text-sm text-ink-400 mt-1">{section.subtitle}</p>}
      <p className="text-xs text-ink-300 mt-1 mb-4">{section.products.length} products</p>
      {section.products.length === 0 ? (
        <p className="text-center text-ink-300 py-12">No products here yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-5">
          {section.products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
