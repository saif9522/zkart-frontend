import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { marketingApi, type Slider } from '@/api/marketing'

/**
 * Zepto-style banner row: TWO banners side by side on desktop, one (with the
 * next one peeking) on phones — swipeable, auto-advancing, never cropped
 * (each image keeps its own shape, so text on the banner isn't cut off).
 */
export function HeroSlider() {
  const { data: allSlides } = useQuery({ queryKey: ['sliders'], queryFn: marketingApi.sliders })
  // Banners whose image fails to load are dropped (no broken boxes).
  const [failed, setFailed] = useState<Set<string>>(() => new Set())
  const slides = (allSlides ?? []).filter((s) => !failed.has(s.id))
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  const scrollToIndex = (i: number) => {
    const track = trackRef.current
    const el = track?.children[i] as HTMLElement | undefined
    if (track && el) track.scrollTo({ left: el.offsetLeft - track.offsetLeft, behavior: 'smooth' })
  }

  // Which banner is at the left edge → dots
  const onScroll = () => {
    const track = trackRef.current
    if (!track) return
    const kids = Array.from(track.children) as HTMLElement[]
    const x = track.scrollLeft
    let best = 0
    kids.forEach((k, i) => {
      if (Math.abs(k.offsetLeft - track.offsetLeft - x) < Math.abs(kids[best].offsetLeft - track.offsetLeft - x)) best = i
    })
    setActive(best)
  }

  const atEnd = () => {
    const t = trackRef.current
    return !t || t.scrollLeft + t.clientWidth >= t.scrollWidth - 8
  }

  // Auto-advance every 5 s; loops back to the first banner.
  useEffect(() => {
    if (slides.length <= 1 || paused) return
    const timer = setInterval(() => scrollToIndex(atEnd() ? 0 : active + 1), 5000)
    return () => clearInterval(timer)
  }, [slides.length, active, paused]) // eslint-disable-line react-hooks/exhaustive-deps

  if (slides.length === 0) return null

  return (
    <section
      className="mt-4 relative group/slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      aria-label="Offers and banners"
    >
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none scroll-smooth"
      >
        {slides.map((slide) => (
          <div key={slide.id} className="snap-start shrink-0 w-[88%] sm:w-[calc(50%-0.5rem)]">
            <SlideCard slide={slide} onError={() => setFailed((prev) => new Set(prev).add(slide.id))} />
          </div>
        ))}
      </div>

      {slides.length > 2 && (
        <>
          <button
            onClick={() => scrollToIndex(Math.max(0, active - 1))}
            className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 shadow-md items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-5 w-5 text-ink-500" />
          </button>
          <button
            onClick={() => scrollToIndex(atEnd() ? 0 : active + 1)}
            className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 shadow-md items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity"
            aria-label="Next banner"
          >
            <ChevronRight className="h-5 w-5 text-ink-500" />
          </button>
        </>
      )}

      {slides.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => scrollToIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === active ? 'w-5 bg-forest-600' : 'w-1.5 bg-ink-100'}`}
              aria-label={`Banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function SlideCard({ slide, onError }: { slide: Slider; onError: () => void }) {
  const content = (
    <div className="relative rounded-2xl overflow-hidden bg-forest-50">
      {/* Natural height: the banner is never cropped */}
      <img src={slide.image} alt={slide.title || 'Banner'} className="block w-full h-auto" onError={onError} draggable={false} />
      {(slide.title || slide.subtitle) && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/60 to-transparent p-3 sm:p-4">
          {slide.title && <h2 className="text-base sm:text-lg font-bold text-rice-50">{slide.title}</h2>}
          {slide.subtitle && <p className="text-xs sm:text-sm text-rice-100/90">{slide.subtitle}</p>}
        </div>
      )}
    </div>
  )
  if (!slide.link_url) return content
  return slide.link_url.startsWith('http') ? (
    <a href={slide.link_url} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  ) : (
    <Link to={slide.link_url}>{content}</Link>
  )
}
