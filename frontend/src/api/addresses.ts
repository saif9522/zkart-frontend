import { api } from '@/api/client'
import type { Address } from '@/types'

export const addressApi = {
  list: () =>
    api.get<Address[] | { results: Address[] }>('/auth/addresses/').then((r) => {
      const data = r.data
      return Array.isArray(data) ? data : data.results
    }),
  create: (payload: Omit<Address, 'id'>) => api.post<Address>('/auth/addresses/', payload).then((r) => r.data),
  update: (id: string, payload: Partial<Omit<Address, 'id'>>) =>
    api.patch<Address>(`/auth/addresses/${id}/`, payload).then((r) => r.data),
  remove: (id: string) => api.delete(`/auth/addresses/${id}/`),
}
