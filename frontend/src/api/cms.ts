import { api } from '@/api/client'
import type { Paginated } from '@/types'

export interface FAQ {
  id: string
  question: string
  answer: string
  display_order: number
}

export interface Page {
  id: string
  title: string
  slug: string
  content: string
  updated_at: string
}

export interface BlogListItem {
  id: string
  title: string
  slug: string
  excerpt: string
  cover_image: string | null
  published_at: string | null
}

export interface BlogDetail extends BlogListItem {
  content: string
}

export interface FooterLink {
  id: string
  section: 'about' | 'quick_links' | 'customer_support' | 'social'
  label: string
  url: string
  display_order: number
}

export const cmsApi = {
  faqs: () => api.get<Paginated<FAQ>>('/cms/faqs/').then((r) => r.data.results),
  page: (slug: string) => api.get<Page>(`/cms/pages/${slug}/`).then((r) => r.data),
  blogList: () => api.get<Paginated<BlogListItem>>('/cms/blog/').then((r) => r.data.results),
  blogDetail: (slug: string) => api.get<BlogDetail>(`/cms/blog/${slug}/`).then((r) => r.data),
  footerLinks: () => api.get<FooterLink[]>('/cms/footer-links/').then((r) => r.data),
  submitContact: (payload: { name: string; email: string; phone?: string; subject: string; message: string }) =>
    api.post('/cms/contact/', payload).then((r) => r.data),
}
