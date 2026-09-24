import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { marketingApi } from '@/api/marketing'

export function HeroSlider() {
  const { data: slides } = useQuery({ queryKey: ['sliders'], queryFn: marketingApi.sliders })
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (!slides || slides.length <= 1) return
    const timer = setInterval(() => setActive((i) => (i + 1) % slides.length), 5000)
    return () => clearInterval(timer)
  }, [slides])

  if (!slides || slides.length === 0) return null

  const slide = slides[active]
  const content = (
    <div className="relative rounded-[var(--radius-card)] overflow-hidden aspect-[21/9] sm:aspect-[3/1] bg-forest-50">
      <img src={slide.image} alt={slide.title} className="h-full w-full object-cover" />
      {(slide.title || slide.subtitle) && (
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 via-transparent to-transparent flex flex-col justify-end p-4 sm:p-6">
          {slide.title && <h2 className="font-display text-lg sm:text-2xl font-semibold text-rice-50">{slide.title}</h2>}
          {slide.subtitle && <p className="text-sm text-rice-100/90 mt-1">{slide.subtitle}</p>}
        </div>
      )}
    </div>
  )

  return (
    <section className="mt-4">
      {slide.link_url ? (
        slide.link_url.startsWith('http') ? (
          <a href={slide.link_url} target="_blank" rel="noopener noreferrer">
            {content}
          </a>
        ) : (
          <Link to={slide.link_url}>{content}</Link>
        )
      ) : (
        content
      )}
      {slides.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all ${i === active ? 'w-5 bg-forest-600' : 'w-1.5 bg-ink-100'}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
