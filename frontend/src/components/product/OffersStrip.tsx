import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ShoppingBasket } from 'lucide-react'
import { marketingApi, type Offer } from '@/api/marketing'

/**
 * "Offers for you" — simple offer cards (offers WITHOUT products; offers with
 * products are shown as full rows by OfferSections). The whole photo is shown
 * (never cropped), discount as a green tag like the product cards.
 */
export function OffersStrip() {
  const { data: allOffers } = useQuery({ queryKey: ['offers'], queryFn: marketingApi.offers })
  const offers = allOffers?.filter((o) => !o.product_count)

  if (!offers || offers.length === 0) return null

  return (
    <section className="mt-8">
      <h2 className="font-display text-lg sm:text-xl font-semibold text-ink-500 mb-3">Offers for you</h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
        {offers.map((offer) => (
          <OfferLink key={offer.id} href={offer.link_url}>
            <OfferCard offer={offer} />
          </OfferLink>
        ))}
      </div>
    </section>
  )
}

function OfferCard({ offer }: { offer: Offer }) {
  const [imgFailed, setImgFailed] = useState(false)
  return (
    <div className="group w-44 sm:w-56 shrink-0 h-full flex flex-col rounded-xl bg-white border border-ink-100/60 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative aspect-[4/3] bg-[#F5F5F7] flex items-center justify-center overflow-hidden">
        {offer.image && !imgFailed ? (
          <img
            src={offer.image}
            alt={offer.title}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <ShoppingBasket className="h-9 w-9 text-forest-400/30" />
        )}
        {offer.discount_label && (
          <span className="absolute top-0 left-0 rounded-br-lg bg-[#0C831F] text-white text-[11px] font-bold px-2 py-0.5">
            {offer.discount_label}
          </span>
        )}
      </div>
      <div className="p-2.5 flex-1">
        <p className="font-semibold text-ink-500 text-[13px] leading-snug line-clamp-2">{offer.title}</p>
        {offer.description && <p className="text-ink-300 text-[12px] mt-0.5 line-clamp-2">{offer.description}</p>}
      </div>
    </div>
  )
}

/** Same-site links open inside the app; other sites open in a new tab. */
function OfferLink({ href, children }: { href: string; children: React.ReactNode }) {
  if (!href) return <div className="shrink-0">{children}</div>
  try {
    const url = new URL(href, window.location.origin)
    if (url.origin === window.location.origin) {
      return (
        <Link to={url.pathname + url.search} className="shrink-0">
          {children}
        </Link>
      )
    }
    return (
      <a href={url.href} target="_blank" rel="noopener noreferrer" className="shrink-0">
        {children}
      </a>
    )
  } catch {
    return <div className="shrink-0">{children}</div>
  }
}
