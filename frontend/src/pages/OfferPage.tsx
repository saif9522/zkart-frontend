import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { marketingApi } from '@/api/marketing'
import { ProductCard } from '@/components/product/ProductCard'
import { useSeo } from '@/hooks/useSeo'

/** All products of one offer (the "See all" target from the homepage row). */
export function OfferPage() {
  const { id } = useParams<{ id: string }>()
  const { data: offer, isLoading, isError } = useQuery({
    queryKey: ['offer', id],
    queryFn: () => marketingApi.offer(id!),
    enabled: !!id,
  })
  useSeo({ title: offer?.title, description: offer?.description || offer?.discount_label })

  if (isLoading) return <div className="mx-auto max-w-6xl px-4 py-8 text-ink-300 animate-pulse">Loading offer…</div>
  if (isError || !offer)
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="text-ink-400">This offer has ended or doesn't exist.</p>
        <Link to="/" className="text-forest-600 font-semibold text-sm mt-2 inline-block">Back to home</Link>
      </div>
    )

  const bg = offer.bg_color && /^#[0-9a-f]{6}$/i.test(offer.bg_color) ? offer.bg_color : '#F3E8FF'
  return (
    <div className="mx-auto max-w-6xl px-4 py-4">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-ink-400 mb-3">
        <ChevronLeft className="h-4 w-4" /> Home
      </Link>
      <div className="rounded-2xl p-4 mb-5" style={{ backgroundColor: bg }}>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="font-display text-2xl font-semibold text-ink-500">{offer.title}</h1>
          {offer.discount_label && (
            <span className="rounded-full bg-chili-600 text-rice-50 text-xs font-bold px-2.5 py-0.5 uppercase">
              {offer.discount_label}
            </span>
          )}
        </div>
        {offer.description && <p className="text-sm text-ink-400 mt-1">{offer.description}</p>}
        <p className="text-xs text-ink-300 mt-1">{offer.products?.length ?? 0} products</p>
      </div>
      {(offer.products?.length ?? 0) === 0 ? (
        <p className="text-center text-ink-300 py-12">No products in this offer right now.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {offer.products!.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
