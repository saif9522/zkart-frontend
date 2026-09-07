import { api } from '@/api/client'
import type { Paginated } from '@/types'

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
}

export const marketingApi = {
  sliders: () => api.get<Paginated<Slider>>('/marketing/sliders/').then((r) => r.data.results),
  banners: (position?: Banner['position']) =>
    api
      .get<Paginated<Banner>>('/marketing/banners/', { params: position ? { position } : {} })
      .then((r) => r.data.results),
  offers: () => api.get<Paginated<Offer>>('/marketing/offers/').then((r) => r.data.results),
}
