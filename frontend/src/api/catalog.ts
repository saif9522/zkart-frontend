import { api } from '@/api/client'
import type { Category, HomeFeedSection, Paginated, ProductDetail, ProductListItem, Review } from '@/types'

export interface ProductFilters {
  category?: string
  brand?: string
  search?: string
  min_price?: number
  max_price?: number
  in_stock?: boolean
  ordering?: string
  page?: number
}

export const catalogApi = {
  categoryTree: () => api.get<Category[]>('/catalog/categories/tree/').then((r) => r.data),

  homeFeed: () => api.get<HomeFeedSection[]>('/catalog/categories/home-feed/').then((r) => r.data),

  products: (filters: ProductFilters = {}) =>
    api.get<Paginated<ProductListItem>>('/catalog/products/', { params: filters }).then((r) => r.data),

  featured: () => api.get<ProductListItem[]>('/catalog/products/featured/').then((r) => r.data),

  productDetail: (slug: string) => api.get<ProductDetail>(`/catalog/products/${slug}/`).then((r) => r.data),

  similar: (slug: string) => api.get<ProductListItem[]>(`/catalog/products/${slug}/similar/`).then((r) => r.data),

  frequentlyBoughtTogether: (slug: string) =>
    api.get<ProductListItem[]>(`/catalog/products/${slug}/frequently-bought-together/`).then((r) => r.data),

  recommendedForYou: () =>
    api.get<ProductListItem[]>('/catalog/products/recommended-for-you/').then((r) => r.data),
}

export const reviewApi = {
  list: (productId: string) =>
    api.get<Paginated<Review>>('/catalog/reviews/', { params: { product: productId } }).then((r) => r.data),
  create: (productId: string, rating: number, comment: string) =>
    api.post<Review>('/catalog/reviews/', { product: productId, rating, comment }).then((r) => r.data),
  remove: (id: string) => api.delete(`/catalog/reviews/${id}/`),
}
