import { api } from '@/api/client'
import type { Paginated, ProductListItem } from '@/types'

export interface Slider {
  id: string
  title: string
  subtitle: string
  image: string
  link_url: string
  display_order: number
}

export interface Banner {
  id: string
  title: string
  image: string
  link_url: string
  position: 'home_top' | 'home_middle' | 'category_page' | 'cart_page'
  display_order: number
}

export interface Offer {
  id: string
  title: string
  description: string
  image: string | null
  discount_label: string
  link_url: string
  display_order: number
  /** Section background (hex). Offers with products render as a Zepto-style product row. */
  bg_color?: string
  product_count?: number
  products?: ProductListItem[]
}

/** A homepage row managed from Admin → Homepage Sections. */
export interface HomeSection {
  id: string
  title: string
  subtitle: string
  kind: 'featured' | 'recommended' | 'new_arrivals' | 'best_sellers' | 'top_deals' | 'category' | 'manual' | 'offers' | 'category_rows'
  bg_color: string
  category_slug: string | null
  display_order: number
  products: ProductListItem[]
}

/** Works whether the API returns a plain list or a paginated {results} object. */
const listOf = <T,>(data: T[] | Paginated<T>): T[] => (Array.isArray(data) ? data : data.results)

export const marketingApi = {
  sliders: () => api.get<Paginated<Slider>>('/marketing/sliders/').then((r) => r.data.results),
  banners: (position?: Banner['position']) =>
    api
      .get<Paginated<Banner>>('/marketing/banners/', { params: position ? { position } : {} })
      .then((r) => r.data.results),
  offers: () => api.get<Offer[] | Paginated<Offer>>('/marketing/offers/').then((r) => listOf(r.data)),
  offer: (id: string) => api.get<Offer>(`/marketing/offers/${id}/`).then((r) => r.data),
  homeSections: () => api.get<HomeSection[] | Paginated<HomeSection>>('/marketing/home-sections/').then((r) => listOf(r.data)),
  homeSection: (id: string) => api.get<HomeSection>(`/marketing/home-sections/${id}/`).then((r) => r.data),
}
