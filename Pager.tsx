import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { usePaginationStore } from '@/store/pagination'

/**
 * Drop-in pagination for any admin list: <Pager endpoint="/admin/orders/" />.
 * Pass `resetOn={[search, status]}` so a new search/filter starts at page 1.
 */
export function Pager({ endpoint, resetOn = [] }: { endpoint: string; resetOn?: unknown[] }) {
  const queryClient = useQueryClient()
  const page = usePaginationStore((s) => s.page[endpoint] ?? 1)
  const count = usePaginationStore((s) => s.count[endpoint])
  const perPage = usePaginationStore((s) => s.perPage[endpoint] ?? 20)
  const setPage = usePaginationStore((s) => s.setPage)

  // Leaving the page → next visit starts at page 1 (and other screens using
  // the same endpoint, e.g. dropdowns, aren't affected).
  useEffect(() => () => setPage(endpoint, 1), [endpoint, setPage])

  // New search / filter → back to page 1.
  const first = useRef(true)
  const key = JSON.stringify(resetOn)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (usePaginationStore.getState().page[endpoint] > 1) {
      setPage(endpoint, 1)
      queryClient.refetchQueries({ type: 'active' })
    }
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  if (count === undefined) return null
  const totalPages = Math.max(1, Math.ceil(count / perPage))
  if (totalPages <= 1) {
    return <p className="text-xs text-ink-300 text-right">{count} item{count === 1 ? '' : 's'}</p>
  }

  const go = (n: number) => {
    setPage(endpoint, Math.min(totalPages, Math.max(1, n)))
    queryClient.refetchQueries({ type: 'active' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="flex items-center justify-between gap-2 flex-wrap text-sm py-1">
      <span className="text-xs text-ink-300">
        {(page - 1) * perPage + 1}–{Math.min(page * perPage, count)} of {count}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          className="h-8 w-8 rounded-lg border border-ink-100 bg-rice-50 flex items-center justify-center disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-ink-500">
          Page <b>{page}</b> of {totalPages}
        </span>
        <button
          onClick={() => go(page + 1)}
          disabled={page >= totalPages}
          className="h-8 w-8 rounded-lg border border-ink-100 bg-rice-50 flex items-center justify-center disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
