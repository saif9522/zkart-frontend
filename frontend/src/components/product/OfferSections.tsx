import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { marketingApi, type Offer } from '@/api/marketing'
import { ProductCard } from '@/components/product/ProductCard'

const safeColor = (c?: string) => (c && /^#[0-9a-f]{6}$/i.test(c) ? c : '#F3E8FF')

/**
 * Zepto-style offer rows under the category strip — each offer the admin
 * filled with products becomes a coloured section with its own product row.
 * Managed entirely from Admin → Offers.
 */
export function OfferSections() {
  const { data: offers } = useQuery({ queryKey: ['offers'], queryFn: marketingApi.offers })
  const sections = (offers ?? []).filter((o) => (o.products?.length ?? 0) > 0)
  if (sections.length === 0) return null
  return (
    <>
      {sections.map((offer) => (
        <OfferSection key={offer.id} offer={offer} />
      ))}
    </>
  )
}

function OfferSection({ offer }: { offer: Offer }) {
  const bg = safeColor(offer.bg_color)
  const more = (offer.product_count ?? 0) > (offer.products?.length ?? 0)
  return (
    <section className="mt-6 rounded-2xl p-3 sm:p-4" style={{ backgroundColor: bg }} aria-label={offer.title}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-display text-lg sm:text-xl font-semibold text-ink-500">{offer.title}</h2>
            {offer.discount_label && (
              <span className="rounded-full bg-chili-600 text-rice-50 text-[11px] font-bold px-2 py-0.5 uppercase tracking-wide">
                {offer.discount_label}
              </span>
            )}
          </div>
          {offer.description && <p className="text-xs text-ink-400 mt-0.5 line-clamp-2">{offer.description}</p>}
        </div>
        <Link
          to={`/offers/${offer.id}`}
          className="flex items-center gap-0.5 text-xs font-semibold text-forest-700 hover:text-forest-600 shrink-0 mt-1"
        >
          See all{more ? ` (${offer.product_count})` : ''} <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {offer.image && (
        <Link to={`/offers/${offer.id}`} className="block mb-3">
          <img
            src={offer.image}
            alt=""
            className="w-full max-h-40 object-cover rounded-xl"
            loading="lazy"
            onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
          />
        </Link>
      )}
      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
        {offer.products!.map((p) => (
          <div key={p.id} className="w-36 sm:w-40 shrink-0">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  )
}
