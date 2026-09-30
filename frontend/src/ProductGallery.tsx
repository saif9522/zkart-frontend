import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ShoppingBasket } from 'lucide-react'

type Img = { id: string; image: string; is_primary?: boolean }

/**
 * Product photos, Zepto-style:
 *  - main photo shows the WHOLE picture (no cropping), primary photo first
 *  - every photo is reachable: thumbnail strip scrolls sideways, big photo
 *    can be swiped (phones) or changed with ‹ › (desktop)
 *  - a photo whose file is missing is dropped instead of leaving a blank box
 */
export function ProductGallery({ images, alt }: { images: Img[]; alt: string }) {
  const [failed, setFailed] = useState<Set<string>>(() => new Set())
  const ordered = useMemo(
    () => [...images].sort((a, b) => Number(!!b.is_primary) - Number(!!a.is_primary)).filter((i) => !failed.has(i.id)),
    [images, failed]
  )
  const [index, setIndex] = useState(0)
  const current = ordered[Math.min(index, ordered.length - 1)]
  const stripRef = useRef<HTMLDivElement>(null)
  const touchX = useRef<number | null>(null)

  useEffect(() => setIndex(0), [images])
  // keep the active thumbnail in view
  useEffect(() => {
    const el = stripRef.current?.children[index] as HTMLElement | undefined
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [index])

  const go = (d: number) => setIndex((i) => (ordered.length ? (i + d + ordered.length) % ordered.length : 0))
  const markFailed = (id: string) => setFailed((prev) => new Set(prev).add(id))

  return (
    // min-w-0: inside the page grid, the long thumbnail strip must scroll instead of widening the column
    <div className="min-w-0">
      <div
        className="relative aspect-square rounded-[var(--radius-card)] bg-white border border-ink-100/60 flex items-center justify-center overflow-hidden group"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return
          const dx = e.changedTouches[0].clientX - touchX.current
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
          touchX.current = null
        }}
      >
        {current ? (
          <img key={current.id} src={current.image} alt={alt} className="h-full w-full object-contain p-2" onError={() => markFailed(current.id)} />
        ) : (
          <ShoppingBasket className="h-16 w-16 text-forest-400/40" />
        )}
        {ordered.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 shadow flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5 text-ink-500" />
            </button>
            <button
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 shadow flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5 text-ink-500" />
            </button>
            <span className="absolute bottom-2 right-2 rounded-full bg-ink-500/70 text-rice-50 text-[11px] font-semibold px-2 py-0.5">
              {Math.min(index, ordered.length - 1) + 1}/{ordered.length}
            </span>
          </>
        )}
      </div>

      {ordered.length > 1 && (
        <div ref={stripRef} className="flex gap-2 mt-3 overflow-x-auto scrollbar-none pb-1">
          {ordered.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setIndex(i)}
              className={`h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-lg overflow-hidden border-2 bg-white ${
                i === index ? 'border-forest-600' : 'border-ink-100 hover:border-forest-300'
              }`}
              aria-label={`Photo ${i + 1}`}
            >
              <img src={img.image} alt="" loading="lazy" className="h-full w-full object-contain p-0.5" onError={() => markFailed(img.id)} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
