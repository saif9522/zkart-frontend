import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight, ShoppingBasket } from 'lucide-react'
import { catalogApi } from '@/api/catalog'
import { marketingApi, type HomeSection } from '@/api/marketing'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductCarousel } from '@/components/product/ProductCarousel'
import { HeroSlider } from '@/components/product/HeroSlider'
import { OffersStrip } from '@/components/product/OffersStrip'
import { OfferSections } from '@/components/product/OfferSections'
import { SafeImage } from '@/components/ui/SafeImage'
import { NearbyStores } from '@/components/product/NearbyStores'

export function HomePage() {
  const { data: categories, isLoading: catLoading } = useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: catalogApi.categoryTree,
  })

  // Rows, their names and their order come from Admin → Homepage Sections.
  const { data: sections, isLoading: secLoading, isError: secError } = useQuery({
    queryKey: ['home-sections'],
    queryFn: marketingApi.homeSections,
    retry: 1,
  })
  const dynamic = !secError && (secLoading || (sections?.length ?? 0) > 0)
  const needsCategoryRows = !dynamic || !!sections?.some((s) => s.kind === 'category_rows')

  const { data: feed, isLoading: feedLoading } = useQuery({
    queryKey: ['home-feed'],
    queryFn: catalogApi.homeFeed,
    enabled: needsCategoryRows,
  })
  // Legacy rows — only if the sections API isn't available (older backend).
  const { data: featured } = useQuery({ queryKey: ['products', 'featured'], queryFn: catalogApi.featured, enabled: !dynamic })
  const { data: recommended } = useQuery({
    queryKey: ['products', 'recommended-for-you'],
    queryFn: catalogApi.recommendedForYou,
    enabled: !dynamic,
  })

  const nothingToShow =
    !secLoading &&
    !feedLoading &&
    !(feed?.length ?? 0) &&
    !(sections ?? []).some((s) => s.products.length > 0) &&
    !(featured?.length ?? 0)

  return (
    <div className="mx-auto max-w-6xl px-4">
      <HeroSlider />
      <CategoryGrid categories={categories} loading={catLoading} />
      <NearbyStores />

      {dynamic ? (
        secLoading ? (
          <RowSkeleton />
        ) : (
          sections!.map((section) => {
            if (section.kind === 'offers')
              return (
                <div key={section.id}>
                  <OfferSections />
                  <OffersStrip />
                </div>
              )
            if (section.kind === 'category_rows')
              return <CategoryRows key={section.id} feed={feed} loading={feedLoading} />
            if (section.products.length === 0) return null
            return <SectionRow key={section.id} section={section} />
          })
        )
      ) : (
        <>
          <OfferSections />
          <OffersStrip />
          {featured && featured.length > 0 && <ProductCarousel title="Trending near you" products={featured} />}
          {recommended && recommended.length > 0 && <ProductCarousel title="Recommended for you" products={recommended} />}
          <CategoryRows feed={feed} loading={feedLoading} />
        </>
      )}

      {nothingToShow && <p className="text-center text-ink-300 py-16">No products yet — check back soon.</p>}

      <div className="h-8" />
    </div>
  )
}

/** One admin-defined product row (Trending, Best sellers, New arrivals, …). */
function SectionRow({ section }: { section: HomeSection }) {
  const bg = /^#[0-9a-f]{6}$/i.test(section.bg_color || '') ? section.bg_color : ''
  return (
    <section
      className={`mt-8 ${bg ? 'rounded-2xl p-3 sm:p-4' : ''}`}
      style={bg ? { backgroundColor: bg } : undefined}
      aria-label={section.title}
    >
      <div className="flex items-end justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg sm:text-xl font-semibold text-ink-500">{section.title}</h2>
          {section.subtitle && <p className="text-xs text-ink-300 mt-0.5">{section.subtitle}</p>}
        </div>
        <Link
          to={section.kind === 'category' && section.category_slug ? `/search?category=${section.category_slug}` : `/collection/${section.id}`}
          className="flex items-center gap-0.5 text-xs sm:text-sm font-semibold text-chili-600 hover:text-chili-500 shrink-0"
        >
          See All <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
        {section.products.map((p) => (
          <div key={p.id} className="w-36 sm:w-40 shrink-0">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  )
}

type FeedRow = { id: string; name: string; slug: string; products: import('@/types').ProductListItem[] }

/** "A row for every category" block. */
function CategoryRows({ feed, loading }: { feed?: FeedRow[]; loading: boolean }) {
  if (loading) return <RowSkeleton />
  return (
    <>
      {(feed ?? []).map((section) => (
        <section key={section.id} id={`cat-${section.slug}`} className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg sm:text-xl font-semibold text-ink-500">{section.name}</h2>
            <Link
              to={`/search?category=${section.slug}`}
              className="flex items-center gap-0.5 text-xs sm:text-sm font-semibold text-chili-600 hover:text-chili-500 shrink-0"
            >
              See All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
            {section.products.map((p) => (
              <div key={p.id} className="w-36 sm:w-40 shrink-0">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}

function RowSkeleton() {
  return (
    <>
      {Array.from({ length: 2 }).map((_, i) => (
        <section key={i} className="mt-8">
          <div className="h-6 w-40 rounded bg-ink-100/50 animate-pulse mb-3" />
          <div className="flex gap-3 overflow-hidden pb-2">
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="w-36 sm:w-40 shrink-0 aspect-[3/4.2] rounded-xl bg-ink-100/40 animate-pulse" />
            ))}
          </div>
        </section>
      ))}
    </>
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
