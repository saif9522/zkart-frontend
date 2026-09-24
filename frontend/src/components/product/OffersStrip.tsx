import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { marketingApi } from '@/api/marketing'

export function OffersStrip() {
  const { data: offers } = useQuery({ queryKey: ['offers'], queryFn: marketingApi.offers })

  if (!offers || offers.length === 0) return null

  return (
    <section className="mt-6">
      <h2 className="font-display text-lg font-semibold text-ink-500 mb-3">Offers for you</h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
        {offers.map((offer) => {
          const card = (
            <div className="w-56 shrink-0 rounded-[var(--radius-card)] bg-mango-50 border border-mango-100 overflow-hidden">
              {offer.image && <img src={offer.image} alt={offer.title} className="h-24 w-full object-cover" />}
              <div className="p-3">
                <p className="font-semibold text-ink-500 text-sm">{offer.title}</p>
                {offer.discount_label && <p className="text-forest-600 text-xs font-semibold mt-0.5">{offer.discount_label}</p>}
                {offer.description && <p className="text-ink-300 text-xs mt-1 line-clamp-2">{offer.description}</p>}
              </div>
            </div>
          )
          return offer.link_url ? (
            <Link key={offer.id} to={offer.link_url}>
              {card}
            </Link>
          ) : (
            <div key={offer.id}>{card}</div>
          )
        })}
      </div>
    </section>
  )
}
