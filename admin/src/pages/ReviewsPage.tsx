import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, Star, Trash2 } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { Badge } from '@/components/ui/Badge'
import type { AdminReview } from '@/types'

function StarRow({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-3.5 w-3.5 ${n <= value ? 'fill-mango-500 text-mango-500' : 'text-ink-200'}`} />
      ))}
    </div>
  )
}

export function ReviewsPage() {
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', search],
    queryFn: () => adminApi.reviews(search ? { search } : {}),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })

  const toggleApproved = useMutation({
    mutationFn: ({ id, is_approved }: { id: string; is_approved: boolean }) =>
      adminApi.setReviewApproved(id, is_approved),
    onSuccess: invalidate,
  })

  const remove = useMutation({ mutationFn: adminApi.deleteReview, onSuccess: invalidate })

  const reviews = data?.results ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-500">Reviews</h1>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product, phone, or comment"
          className="w-full rounded-lg border border-ink-100 bg-rice-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-forest-400"
        />
      </div>

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs text-ink-300">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Rating</th>
              <th className="px-4 py-3 font-medium">Comment</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-300">Loading...</td>
              </tr>
            )}
            {reviews.map((r: AdminReview) => (
              <tr key={r.id} className="border-b border-ink-100/60 last:border-0">
                <td className="px-4 py-3 text-ink-500">{r.product_name}</td>
                <td className="px-4 py-3">
                  <div className="text-ink-500">{r.customer_name || '—'}</div>
                  <div className="text-xs text-ink-300 font-mono">{r.customer_phone}</div>
                </td>
                <td className="px-4 py-3"><StarRow value={r.rating} /></td>
                <td className="px-4 py-3 text-ink-400 max-w-xs truncate">{r.comment || '—'}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleApproved.mutate({ id: r.id, is_approved: !r.is_approved })}>
                    <Badge status={r.is_approved ? 'active' : 'inactive'} label={r.is_approved ? 'Approved' : 'Hidden'} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => remove.mutate(r.id)} className="text-ink-300 hover:text-chili-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {data && reviews.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-300">No reviews yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
