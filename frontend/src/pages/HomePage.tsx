import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChevronRight, ShoppingBasket } from 'lucide-react'
import { catalogApi } from '@/api/catalog'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductCarousel } from '@/components/product/ProductCarousel'
import { HeroSlider } from '@/components/product/HeroSlider'
import { OffersStrip } from '@/components/product/OffersStrip'
import { NearbyStores } from '@/components/product/NearbyStores'

export function HomePage() {
  const categoryStripRef = useRef<HTMLDivElement>(null)

  // One call for the icon strip, one call for every category's products —
  // not one call per category (that's what made the homepage slow before).
  const { data: categories, isLoading: catLoading } = useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: catalogApi.categoryTree,
  })

  const { data: feed, isLoading: feedLoading } = useQuery({
    queryKey: ['home-feed'],
    queryFn: catalogApi.homeFeed,
  })

  const { data: featured, isLoading: featLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: catalogApi.featured,
  })

  const { data: recommended } = useQuery({
    queryKey: ['products', 'recommended-for-you'],
    queryFn: catalogApi.recommendedForYou,
  })

  return (
    <div className="mx-auto max-w-6xl px-4">
      <HeroSlider />
      <OffersStrip />
      <NearbyStores />

      {/* Category strip — tap an icon to jump straight to that category's row below */}
      <section className="mt-6 relative">
        <div ref={categoryStripRef} className="flex gap-4 overflow-x-auto scrollbar-none pb-4">
          {catLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                  <div className="h-16 w-16 rounded-2xl bg-ink-100/50 animate-pulse" />
                  <div className="h-3 w-12 rounded bg-ink-100/50 animate-pulse" />
                </div>
              ))
            : categories?.map((cat) => (
                <a key={cat.id} href={`#cat-${cat.slug}`} className="flex flex-col items-center gap-1.5 shrink-0 w-16">
                  <div className="h-16 w-16 rounded-xl bg-rice-50 flex items-center justify-center border border-ink-100/60 shadow-sm">
                    {cat.icon ? (
                      <img src={cat.icon} alt="" className="h-10 w-10 object-contain" loading="lazy" />
                    ) : (
                      <ShoppingBasket className="h-7 w-7 text-forest-600" />
                    )}
                  </div>
                  <span className="text-[11px] text-center text-ink-400 leading-tight">{cat.name}</span>
                </a>
              ))}
        </div>
        {!catLoading && (categories?.length ?? 0) > 8 && (
          <button
            onClick={() => categoryStripRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 -mt-2 h-9 w-9 rounded-full bg-ink-500 text-rice-50 items-center justify-center shadow-md hover:bg-ink-400"
            aria-label="Show more categories"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </section>

      {/* Featured / trending */}
      {(featLoading || !!featured?.length) && (
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl font-semibold text-ink-500">Trending near you</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-4">
            {featLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-40 shrink-0 aspect-[3/4.2] rounded-[var(--radius-card)] bg-ink-100/40 animate-pulse" />
                ))
              : featured?.map((p) => (
                  <div key={p.id} className="w-40 shrink-0">
                    <ProductCard product={p} />
                  </div>
                ))}
          </div>
        </section>
      )}

      {recommended && recommended.length > 0 && (
        <ProductCarousel title="Recommended for you" products={recommended} />
      )}

      {/* One horizontal-scroll row per category — all from a single API call */}
      {feedLoading
        ? Array.from({ length: 3 }).map((_, i) => (
            <section key={i} className="mt-8">
              <div className="h-6 w-40 rounded bg-ink-100/50 animate-pulse mb-3" />
              <div className="flex gap-3 overflow-x-auto scrollbar-none pb-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="w-40 shrink-0 aspect-[3/4.2] rounded-[var(--radius-card)] bg-ink-100/40 animate-pulse" />
                ))}
              </div>
            </section>
          ))
        : feed?.map((section) => (
            <section key={section.id} id={`cat-${section.slug}`} className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-xl font-semibold text-ink-500">{section.name}</h2>
                <Link
                  to={`/search?category=${section.slug}`}
                  className="flex items-center gap-0.5 text-xs font-semibold text-forest-600 hover:text-forest-700 shrink-0"
                >
                  See All <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-none pb-4">
                {section.products.map((p) => (
                  <div key={p.id} className="w-40 shrink-0">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            </section>
          ))}

      {!feedLoading && feed?.length === 0 && !featured?.length && (
        <p className="text-center text-ink-300 py-16">No products yet — check back soon.</p>
      )}

      <div className="h-8" />
    </div>
  )
}
