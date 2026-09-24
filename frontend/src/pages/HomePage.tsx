import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight, ShoppingBasket } from 'lucide-react'
import { catalogApi } from '@/api/catalog'
import { marketingApi } from '@/api/marketing'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductCarousel } from '@/components/product/ProductCarousel'
import { HeroSlider } from '@/components/product/HeroSlider'
import { OffersStrip } from '@/components/product/OffersStrip'
import { OfferSections } from '@/components/product/OfferSections'
import { SafeImage } from '@/components/ui/SafeImage'
import { NearbyStores } from '@/components/product/NearbyStores'

export function HomePage() {
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

  const { data: offers } = useQuery({ queryKey: ['offers'], queryFn: marketingApi.offers })
  const hasOfferSections = (offers ?? []).some((o) => (o.products?.length ?? 0) > 0)

  const { data: recommended } = useQuery({
    queryKey: ['products', 'recommended-for-you'],
    queryFn: catalogApi.recommendedForYou,
  })

  return (
    <div className="mx-auto max-w-6xl px-4">
      <HeroSlider />

      <CategoryGrid categories={categories} loading={catLoading} />

      {/* Admin-managed offer rows (Admin → Offers → add products) — right under the categories */}
      <OfferSections />
      <OffersStrip />
      <NearbyStores />

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

      {!feedLoading && feed?.length === 0 && !featured?.length && !hasOfferSections && (
        <p className="text-center text-ink-300 py-16">No products yet — check back soon.</p>
      )}

      <div className="h-8" />
    </div>
  )
}

type CategoryItem = { id: string; name: string; slug: string; icon?: string | null }

/**
 * Zepto-style "Shop by Category": big picture tiles in a grid, full names
 * (2 lines), 4 per row on phones → 10 on desktop. Collapsed to 2 rows until
 * "See All" is tapped.
 */
function CategoryGrid({ categories, loading }: { categories?: CategoryItem[]; loading: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const list = categories ?? []
  // collapsed: 8 on phones (2 rows of 4), 20 on desktop (2 rows of 10)
  const MOBILE = 8
  const DESKTOP = 20
  const hasMore = list.length > MOBILE

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg sm:text-xl font-semibold text-ink-500">Shop by Category</h2>
        {hasMore && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className={`flex items-center gap-0.5 text-xs sm:text-sm font-semibold text-chili-600 hover:text-chili-500 ${
              list.length <= DESKTOP ? 'lg:hidden' : ''
            }`}
          >
            {expanded ? 'Show less' : 'See All'}
            {expanded ? <ChevronDown className="h-4 w-4 rotate-180" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        )}
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-x-2.5 sm:gap-x-3 gap-y-4">
        {loading
          ? Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="aspect-square rounded-2xl bg-ink-100/50 animate-pulse" />
                <div className="h-3 w-3/4 mx-auto rounded bg-ink-100/50 animate-pulse" />
              </div>
            ))
          : list.map((cat, i) => {
              const hiddenWhenCollapsed = !expanded && (i >= DESKTOP ? 'hidden' : i >= MOBILE ? 'hidden lg:flex' : '')
              return (
                <Link
                  key={cat.id}
                  to={`/search?category=${cat.slug}`}
                  className={`group flex flex-col items-center gap-1.5 ${hiddenWhenCollapsed || ''}`}
                >
                  <div className="w-full aspect-square rounded-2xl bg-[#F4F0FF] flex items-center justify-center overflow-hidden transition-transform group-hover:scale-[1.03]">
                    {cat.icon ? (
                      <SafeImage src={cat.icon} alt={cat.name} className="object-contain p-1" iconClassName="h-8 w-8 text-forest-600/60" />
                    ) : (
                      <ShoppingBasket className="h-8 w-8 text-forest-600/60" />
                    )}
                  </div>
                  <span className="text-[11px] sm:text-[13px] font-medium text-ink-500 text-center leading-snug line-clamp-2 break-words w-full">
                    {cat.name}
                  </span>
                </Link>
              )
            })}
      </div>
    </section>
  )
}
