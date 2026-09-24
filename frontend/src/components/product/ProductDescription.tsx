import { useEffect, useMemo, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import { ChevronDown, ChevronUp } from 'lucide-react'

/**
 * Descriptions are often pasted from Amazon/Flipkart as HTML. The backend
 * already strips anything unsafe on save; this is a SECOND, independent
 * check in the browser (DOMPurify) with the same strict allow-list — no
 * attributes at all, so no onclick/href/src/style can ever get through.
 * Plain-text descriptions keep their line breaks as before.
 */
const ALLOWED_TAGS = [
  'p', 'br', 'hr', 'h2', 'h3', 'h4', 'h5', 'strong', 'b', 'em', 'i', 'u', 'small', 'sub', 'sup',
  'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
]
const COLLAPSED_HEIGHT = 320 // px — long spec sheets start folded

const looksLikeHtml = (text: string) => /<\/?[a-z][\s\S]*?>/i.test(text)

export function ProductDescription({ text }: { text: string }) {
  const isHtml = looksLikeHtml(text)
  const safeHtml = useMemo(() => {
    if (!isHtml) return ''
    const fragment = DOMPurify.sanitize(text, {
      ALLOWED_TAGS,
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
      RETURN_DOM_FRAGMENT: true,
    })
    // Imported spec sheets often have all-lowercase headings ("key features").
    // Title-case ONLY those — so brand spellings like "iPhone" stay untouched.
    fragment.querySelectorAll('h2, h3, h4, h5').forEach((h) => {
      const t = h.textContent ?? ''
      if (t && t === t.toLowerCase()) h.textContent = t.replace(/\b\p{L}/gu, (c) => c.toUpperCase())
    })
    const holder = document.createElement('div')
    holder.appendChild(fragment)
    return holder.innerHTML
  }, [text, isHtml])

  const bodyRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [isLong, setIsLong] = useState(false)
  useEffect(() => {
    const el = bodyRef.current
    if (el) setIsLong(el.scrollHeight > COLLAPSED_HEIGHT + 40)
  }, [safeHtml, text])

  return (
    <div className="mt-8 rounded-[var(--radius-card)] border border-ink-100/60 bg-rice-50 p-4">
      <h2 className="text-sm font-semibold text-ink-500 mb-3">Description</h2>
      <div className="relative">
        <div
          ref={bodyRef}
          className="overflow-hidden transition-[max-height] duration-300"
          style={{ maxHeight: isLong && !expanded ? COLLAPSED_HEIGHT : undefined }}
        >
          {isHtml ? (
            // eslint-disable-next-line react/no-danger -- double-sanitized (server nh3 + DOMPurify), no attributes allowed
            <div className="product-desc" dangerouslySetInnerHTML={{ __html: safeHtml }} />
          ) : (
            <p className="text-sm text-ink-400 whitespace-pre-line leading-relaxed">{text}</p>
          )}
        </div>
        {isLong && !expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-rice-50 to-transparent" />
        )}
      </div>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 flex items-center gap-1 text-sm font-semibold text-forest-600"
        >
          {expanded ? (
            <>
              Show less <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Read more <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      )}
    </div>
  )
}
