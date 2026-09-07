import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Star, Trash2 } from 'lucide-react'
import { reviewApi } from '@/api/catalog'
import { apiErrorMessage } from '@/api/client'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'

function StarRow({ value, onChange }: { value: number; size?: string; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star className={`h-4 w-4 ${n <= value ? 'fill-mango-500 text-mango-500' : 'text-ink-200'}`} />
        </button>
      ))}
    </div>
  )
}

export function ReviewsSection({ productId }: { productId: string }) {
  const isAuthed = !!useAuthStore((s) => s.accessToken)
  const queryClient = useQueryClient()

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [myReviewId, setMyReviewId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => reviewApi.list(productId),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['reviews', productId] })

  const submit = useMutation({
    mutationFn: () => reviewApi.create(productId, rating, comment),
    onSuccess: (review) => {
      invalidate()
      setMyReviewId(review.id)
      setRating(0)
      setComment('')
      setError('')
    },
    onError: (err) => {
      const message = apiErrorMessage(err, 'Could not submit your review.')
      setError(message.replace(/^product:\s*/i, ''))
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => reviewApi.remove(id),
    onSuccess: () => {
      invalidate()
      setMyReviewId(null)
    },
  })

  const reviews = data?.results ?? []
  const alreadyReviewed = !!myReviewId

  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-semibold text-ink-500 mb-3">
        Ratings & reviews {data ? `(${data.count})` : ''}
      </h2>

      {isLoading && <p className="text-ink-300 text-sm animate-pulse">Loading reviews...</p>}

      <div className="flex flex-col gap-3 mb-4">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-xl bg-rice-50 border border-ink-100/60 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StarRow value={r.rating} />
                <span className="text-sm font-medium text-ink-500">{r.customer_name || 'Customer'}</span>
              </div>
              {myReviewId === r.id && (
                <button onClick={() => remove.mutate(r.id)} className="text-ink-200 hover:text-chili-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {r.comment && <p className="text-sm text-ink-400 mt-1.5">{r.comment}</p>}
          </div>
        ))}
        {data && reviews.length === 0 && (
          <p className="text-sm text-ink-300">No reviews yet — be the first to review this product.</p>
        )}
      </div>

      {isAuthed && !alreadyReviewed && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (rating === 0) {
              setError('Please select a rating.')
              return
            }
            submit.mutate()
          }}
          className="rounded-xl border border-ink-100 bg-rice-50 p-3 flex flex-col gap-2.5"
        >
          <span className="text-xs font-semibold text-ink-400">Write a review</span>
          <StarRow value={rating} onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience (optional)"
            rows={2}
            className="rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-forest-400 resize-none"
          />
          {error && <p className="text-xs text-chili-600">{error}</p>}
          <Button type="submit" size="sm" loading={submit.isPending} className="self-start">
            Submit review
          </Button>
        </form>
      )}
    </section>
  )
}
