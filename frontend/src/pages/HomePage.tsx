import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChevronRight, ShoppingBasket } from 'lucide-react'
import { catalogApi } from '@/api/catalog'
import { marketingApi, type HomeSection } from '@/api/marketing'
import { vendorsApi } from '@/api/vendors'
import { useLocationStore } from '@/store/location'
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
      <AreaBanner />
      <HeroSlider />
      <CategoryStrip categories={categories} loading={catLoading} />
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
            if (section.kind === 'price_zones')
              return (section.tabs ?? []).some((t) => t.products.length) ? <PriceZoneSection key={section.id} section={section} /> : null
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

type CategoryItem = { id: string; name: string; slug: string; icon?: string | null; show_on_home?: boolean }


/** Zepto-style notice when no branch delivers to the chosen location (products stay visible). */
function AreaBanner() {
  const location = useLocationStore((st) => st.location)
  const pincode = location?.detail.match(/\b\d{6}\b/)?.[0]
  const { data } = useQuery({
    queryKey: ['serviceability', location?.lat, location?.lng, pincode],
    queryFn: () => vendorsApi.serviceability({ lat: location!.lat, lng: location!.lng, pincode }),
    enabled: !!location,
    staleTime: 5 * 60 * 1000,
  })
  if (!location || !data || data.available) return null
  return (
    <div className="mt-4 rounded-xl bg-mango-50 border border-mango-300 px-4 py-3 flex items-center gap-3">
      <span className="text-2xl" aria-hidden>🛵</span>
      <div className="min-w-0">
        <p className="font-semibold text-ink-500 text-sm">{data.message || 'Hum abhi aapke area mein nahi hain. Jald aa rahe hain!'}</p>
        <p className="text-xs text-ink-400">
          {location.label} — aap products dekh sakte hain; order ke liye hamare delivery area ka address chunein.
        </p>
      </div>
    </div>
  )
}

/**
 * Zepto-style category strip: ALL categories in ONE swipeable line. Tapping a
 * category shows its products right underneath (no page change); "See all"
 * opens the full category page.
 */
function CategoryStrip({ categories, loading }: { categories?: CategoryItem[]; loading: boolean }) {
  const list = (categories ?? []).filter((c) => c.show_on_home !== false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const active = list.find((c) => c.id === activeId) ?? list[0]
  const trackRef = useRef<HTMLDivElement>(null)
  // same query key as the page's feed → shared cache, no extra request
  const { data: feed, isLoading: feedLoading } = useQuery({ queryKey: ['home-feed'], queryFn: catalogApi.homeFeed })
  const products = feed?.find((f) => f.id === active?.id || f.slug === active?.slug)?.products ?? []

  const scroll = (dir: 1 | -1) => trackRef.current?.scrollBy({ left: dir * trackRef.current.clientWidth * 0.8, behavior: 'smooth' })

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg sm:text-xl font-semibold text-ink-500">Shop by Category</h2>
        <div className="hidden sm:flex gap-2">
          <button onClick={() => scroll(-1)} className="h-8 w-8 rounded-full border border-ink-100 bg-white flex items-center justify-center hover:border-forest-400" aria-label="Scroll categories left">
            <ChevronRight className="h-4 w-4 rotate-180" />
          </button>
          <button onClick={() => scroll(1)} className="h-8 w-8 rounded-full border border-ink-100 bg-white flex items-center justify-center hover:border-forest-400" aria-label="Scroll categories right">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* one line, swipe sideways */}
      <div ref={trackRef} className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-none border-b border-ink-100 snap-x">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-20 sm:w-24 shrink-0 flex flex-col items-center gap-2 pb-3">
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-ink-100/50 animate-pulse" />
                <div className="h-3 w-12 rounded bg-ink-100/50 animate-pulse" />
              </div>
            ))
          : list.map((cat) => {
              const isActive = cat.id === active?.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveId(cat.id)}
                  className="relative w-20 sm:w-24 shrink-0 snap-start flex flex-col items-center gap-1.5 pt-1 pb-3 group"
                  aria-pressed={isActive}
                >
                  <span
                    className={`h-14 w-14 sm:h-16 sm:w-16 rounded-2xl flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 ${
                      isActive ? 'bg-forest-50 ring-2 ring-forest-600/40' : 'bg-[#F4F0FF]'
                    }`}
                  >
                    {cat.icon ? (
                      <SafeImage src={cat.icon} alt={cat.name} className="object-contain p-1" iconClassName="h-7 w-7 text-forest-600/60" />
                    ) : (
                      <ShoppingBasket className="h-7 w-7 text-forest-600/60" />
                    )}
                  </span>
                  <span className={`text-[11px] sm:text-xs text-center leading-snug line-clamp-2 px-0.5 ${isActive ? 'font-bold text-ink-500' : 'font-medium text-ink-400'}`}>
                    {cat.name}
                  </span>
                  {isActive && <span className="absolute bottom-0 left-3 right-3 h-[3px] rounded-t-full bg-ink-500" />}
                </button>
              )
            })}
      </div>

      {/* products of the selected category */}
      {active && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-ink-500">{active.name}</p>
            <Link to={`/search?category=${active.slug}`} className="flex items-center gap-0.5 text-xs sm:text-sm font-semibold text-chili-600">
              See All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {feedLoading ? (
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-36 sm:w-40 shrink-0 aspect-[3/4.2] rounded-xl bg-ink-100/40 animate-pulse" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
              {products.map((p) => (
                <div key={p.id} className="w-36 sm:w-40 shrink-0">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-300 py-6 text-center">Is category mein products jald aa rahe hain.</p>
          )}
        </div>
      )}
    </section>
  )
}

/**
 * Zepto "FRESH @₹5" style: big title, tabs ₹5 Zone / ₹10 Zone / ₹15 Zone,
 * products up to that price below. Built in Admin → Homepage Sections.
 */
function PriceZoneSection({ section }: { section: HomeSection }) {
  const tabs = (section.tabs ?? []).filter((t) => t.products.length > 0)
  const [active, setActive] = useState(0)
  const tab = tabs[Math.min(active, tabs.length - 1)]
  const bg = /^#[0-9a-f]{6}$/i.test(section.bg_color || '') ? section.bg_color : '#FFF1F4'
  if (!tab) return null
  return (
    <section className="mt-8 rounded-2xl p-3 sm:p-4" style={{ backgroundColor: bg }} aria-label={section.title}>
      <h2 className="font-display text-xl sm:text-2xl font-extrabold text-forest-700 tracking-tight">{section.title}</h2>
      {section.subtitle && <p className="text-xs sm:text-sm text-ink-400 mt-0.5">{section.subtitle}</p>}

      <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none border-b border-ink-100">
        {tabs.map((t, i) => {
          const on = i === active
          return (
            <button key={t.label} onClick={() => setActive(i)} className="relative shrink-0 flex flex-col items-center gap-1 px-2 pb-2.5" aria-pressed={on}>
              <span
                className={`h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center text-rice-50 font-extrabold text-sm sm:text-base transition-transform ${on ? 'scale-105' : 'opacity-80'}`}
                style={{
                  background: '#E0284F',
                  clipPath:
                    'polygon(50% 0%, 61% 11%, 75% 7%, 79% 21%, 93% 25%, 89% 39%, 100% 50%, 89% 61%, 93% 75%, 79% 79%, 75% 93%, 61% 89%, 50% 100%, 39% 89%, 25% 93%, 21% 79%, 7% 75%, 11% 61%, 0% 50%, 11% 39%, 7% 25%, 21% 21%, 25% 7%, 39% 11%)',
                }}
              >
                {t.label.replace(' Zone', '')}
              </span>
              <span className={`text-[11px] sm:text-xs ${on ? 'font-bold text-ink-500' : 'font-medium text-ink-400'}`}>{t.label}</span>
              {on && <span className="absolute bottom-0 left-2 right-2 h-[3px] rounded-t-full bg-ink-500" />}
            </button>
          )
        })}
        <Link
          to={`/search?max_price=${tab.max_price}${section.category_slug ? `&category=${section.category_slug}` : ''}`}
          className="ml-auto self-center shrink-0 flex items-center gap-0.5 text-xs sm:text-sm font-semibold text-chili-600 pb-2"
        >
          See All <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-3 flex gap-3 overflow-x-auto scrollbar-none pb-1">
        {tab.products.map((p) => (
          <div key={p.id} className="w-36 sm:w-40 shrink-0">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  )
}
