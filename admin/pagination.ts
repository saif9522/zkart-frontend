import { create } from 'zustand'

/**
 * Page state for every admin list, keyed by API endpoint ("/admin/orders/").
 * The API client reads `page` from here when fetching a list, and records the
 * total `count` from the response, so <Pager endpoint=…/> can show controls
 * without each page having to wire pagination by hand.
 */
interface PaginationState {
  page: Record<string, number>
  count: Record<string, number>
  perPage: Record<string, number>
  setPage: (endpoint: string, page: number) => void
  record: (endpoint: string, count: number, perPage?: number) => void
}

export const usePaginationStore = create<PaginationState>((set) => ({
  page: {},
  count: {},
  perPage: {},
  setPage: (endpoint, page) => set((s) => ({ page: { ...s.page, [endpoint]: page } })),
  record: (endpoint, count, perPage) =>
    set((s) => ({
      count: { ...s.count, [endpoint]: count },
      perPage: perPage ? { ...s.perPage, [endpoint]: perPage } : s.perPage,
    })),
}))

/** "/api/v1/admin/orders/?x=1" or "/admin/orders/" → "/admin/orders/" */
export function endpointOf(url: string | undefined): string {
  if (!url) return ''
  const path = url.split('?')[0]
  const i = path.search(/\/(admin|super-admin)\//)
  return i >= 0 ? path.slice(i) : path
}
