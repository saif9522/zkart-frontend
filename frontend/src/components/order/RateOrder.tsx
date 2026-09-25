import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Star } from 'lucide-react'
import { ordersApi } from '@/api/orders'
import { apiErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

function Stars({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div>
      <p className="text-xs text-ink-400 mb-1">{label}</p>
      <div className="flex gap-1" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} star`} className="p-0.5">
            <Star className={cn('h-7 w-7 transition-colors', n <= value ? 'text-mango-500 fill-mango-500' : 'text-ink-100')} />
          </button>
        ))}
      </div>
    </div>
  )
}

/** Shown on a delivered order until the customer rates it. Shop + rider rated separately. */
export function RateOrder({ orderId, hasRider }: { orderId: string; hasRider: boolean }) {
  const queryClient = useQueryClient()
  const [shop, setShop] = useState(0)
  const [rider, setRider] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  const submit = useMutation({
    mutationFn: () =>
      ordersApi.rate(orderId, { shop_rating: shop, delivery_rating: hasRider && rider ? rider : null, comment }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['order', orderId] }),
    onError: (err) => setError(apiErrorMessage(err, 'Could not save your rating.')),
  })

  return (
    <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4 mb-4 flex flex-col gap-3">
      <p className="text-sm font-semibold text-ink-500">How was your order?</p>
      <Stars value={shop} onChange={setShop} label="Shop — packing, freshness, right items" />
      {hasRider && <Stars value={rider} onChange={setRider} label="Delivery partner" />}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder="Anything we should know? (optional)"
        className="rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-forest-400 resize-none"
      />
      {error && <p className="text-xs text-chili-600">{error}</p>}
      <Button onClick={() => submit.mutate()} loading={submit.isPending} disabled={shop === 0}>
        Submit rating
      </Button>
    </div>
  )
}
