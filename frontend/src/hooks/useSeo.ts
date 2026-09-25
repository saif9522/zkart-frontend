import { useEffect } from 'react'

const SITE = 'zKart.shop'
const DEFAULT_TITLE = 'zKart.shop — Fast delivery, right to your door'
const DEFAULT_DESC = 'Groceries, fruits, medicines and more — delivered fast with zKart.shop.'

interface SeoOptions {
  title?: string
  description?: string
  image?: string
  /** Absolute canonical URL; defaults to the current URL without query/hash. */
  canonical?: string
  type?: 'website' | 'product' | 'article'
  /** schema.org JSON-LD object — lets Google show price/stock/rating in search results. */
  jsonLd?: Record<string, unknown> | null
  noindex?: boolean
}

function setMeta(attr: 'name' | 'property', key: string, content: string | undefined) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!content) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/**
 * Per-page <title>, description, Open Graph (WhatsApp/Facebook previews),
 * canonical URL and JSON-LD. Google renders JS, so this is picked up for
 * search; WhatsApp link previews use the static defaults in index.html.
 */
export function useSeo({ title, description, image, canonical, type = 'website', jsonLd, noindex }: SeoOptions) {
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : ''

  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE}` : DEFAULT_TITLE
    const desc = (description || DEFAULT_DESC).replace(/\s+/g, ' ').trim().slice(0, 160)
    const url = canonical || `${window.location.origin}${window.location.pathname}`

    document.title = fullTitle
    setMeta('name', 'description', desc)
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : undefined)
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', desc)
    setMeta('property', 'og:type', type)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:image', image)
    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary')

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'canonical'
      document.head.appendChild(link)
    }
    link.href = url

    let script: HTMLScriptElement | null = null
    if (jsonLdString) {
      script = document.createElement('script')
      script.type = 'application/ld+json'
      script.dataset.seo = 'page'
      script.text = jsonLdString
      document.head.appendChild(script)
    }

    return () => {
      script?.remove()
      document.title = DEFAULT_TITLE
      setMeta('name', 'description', DEFAULT_DESC)
      setMeta('name', 'robots', undefined)
      setMeta('property', 'og:image', undefined)
    }
  }, [title, description, image, canonical, type, jsonLdString, noindex])
}
