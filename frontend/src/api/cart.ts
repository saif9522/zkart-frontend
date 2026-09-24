import { api } from '@/api/client'
import type { Cart, Paginated, WishlistItem } from '@/types'

export const cartApi = {
  get: () => api.get<Cart>('/cart/').then((r) => r.data),
  clear: () => api.delete<Cart>('/cart/').then((r) => r.data),
  addItem: (product_id: string, quantity = 1) =>
    api.post<Cart>('/cart/items/', { product_id, quantity }).then((r) => r.data),
  updateItem: (itemId: string, quantity: number) =>
    api.patch<Cart>(`/cart/items/${itemId}/`, { quantity }).then((r) => r.data),
  removeItem: (itemId: string) => api.delete<Cart>(`/cart/items/${itemId}/`).then((r) => r.data),
}

export const wishlistApi = {
  list: () => api.get<Paginated<WishlistItem>>('/cart/wishlist/').then((r) => r.data),
  add: (product_id: string) => api.post<WishlistItem>('/cart/wishlist/', { product_id }).then((r) => r.data),
  remove: (id: string) => api.delete(`/cart/wishlist/${id}/`),
}
