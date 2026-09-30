import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Sparkles } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { apiErrorMessage } from '@/api/client'
import { AdminImage } from '@/components/ui/AdminImage'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

const LEVELS = [
  { label: 'Strict (sirf pakke match)', value: 0.75 },
  { label: 'Normal', value: 0.6 },
  { label: 'Loose (zyada suggestions)', value: 0.5 },
]

/**
 * Finds Media Library photos whose NAME matches a product that has no photo
 * yet, shows them for review, and attaches the ticked ones — no re-upload.
 */
export function MatchPhotosModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [level, setLevel] = useState(0.6)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')

  const find = useMutation({
    mutationFn: () => adminApi.matchMedia(level),
    onMutate: () => setError(''),
    onSuccess: (d) => setPicked(new Set(d.matches.filter((m) => m.score >= 0.7).map((m) => m.product_id))),
    onError: (e) => setError(apiErrorMessage(e, 'Could not search photos.')),
  })
  const attach = useMutation({
    mutationFn: () =>
      adminApi.attachMedia(
        (find.data?.matches ?? []).filter((m) => picked.has(m.product_id)).map((m) => ({ product_id: m.product_id, asset_id: m.asset_id }))
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      find.reset()
      setPicked(new Set())
    },
    onError: (e) => setError(apiErrorMessage(e, 'Could not attach photos.')),
  })

  const matches = find.data?.matches ?? []
  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const close = () => {
    find.reset()
    attach.reset()
    setPicked(new Set())
    setError('')
    onClose()
  }

  return (
    <Modal open={open} onClose={close} title="Match photos to products">
      <div className="flex flex-col gap-3 text-sm">
        <p className="text-xs text-ink-400">
          Media Library ki photos ke <b>naam</b> ko un products se milata hai jinki abhi koi photo nahi hai (jaise
          <i> aashirvaad-atta-5kg.jpg → Aashirvaad Atta 5kg</i>). Aap check karke ✅ lagayein, tabhi judegi. Photo dobara upload
          nahi hoti.
        </p>

        {attach.data && (
          <p className="flex items-center gap-1.5 rounded-lg bg-forest-50 border border-forest-100 px-3 py-2 text-forest-700 font-semibold">
            <CheckCircle2 className="h-4 w-4" /> {attach.data.attached} product(s) ko photo mil gayi.
          </p>
        )}

        <div className="flex gap-2 items-center flex-wrap">
          <select value={level} onChange={(e) => setLevel(Number(e.target.value))} className="rounded-lg border border-ink-100 bg-rice-50 px-2.5 py-2 text-sm">
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <Button onClick={() => find.mutate()} loading={find.isPending}>
            <Sparkles className="h-4 w-4" /> Find matches
          </Button>
        </div>

        {find.data && (
          <p className="text-xs text-ink-300">
            {find.data.products_without_photo} products bina photo · {find.data.photos_checked} photos check ki · <b>{matches.length} match mile</b>
          </p>
        )}

        {matches.length > 0 && (
          <>
            <label className="flex items-center gap-2 text-xs text-ink-400">
              <input
                type="checkbox"
                className="accent-forest-600"
                checked={picked.size === matches.length}
                onChange={(e) => setPicked(e.target.checked ? new Set(matches.map((m) => m.product_id)) : new Set())}
              />
              Select all ({picked.size}/{matches.length} selected)
            </label>
            <ul className="max-h-[45vh] overflow-y-auto rounded-lg border border-ink-100 divide-y divide-ink-100/60">
              {matches.map((m) => (
                <li key={m.product_id} className={`flex items-center gap-3 px-2.5 py-2 ${picked.has(m.product_id) ? 'bg-forest-50/60' : ''}`}>
                  <input type="checkbox" className="accent-forest-600 shrink-0" checked={picked.has(m.product_id)} onChange={() => toggle(m.product_id)} />
                  {m.asset_url ? (
                    <AdminImage src={m.asset_url} className="h-12 w-12 shrink-0 rounded-lg object-cover border border-ink-100" />
                  ) : (
                    <span className="h-12 w-12 shrink-0 rounded-lg bg-rice-100" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink-500 truncate">{m.product_name}</p>
                    <p className="text-[11px] text-ink-300 truncate">← {m.asset_name}</p>
                  </div>
                  <span className={`text-xs font-mono font-semibold shrink-0 ${m.score >= 0.75 ? 'text-forest-600' : m.score >= 0.6 ? 'text-mango-600' : 'text-ink-400'}`}>
                    {Math.round(m.score * 100)}%
                  </span>
                </li>
              ))}
            </ul>
            <Button onClick={() => attach.mutate()} loading={attach.isPending} disabled={picked.size === 0}>
              Attach {picked.size} photo(s)
            </Button>
          </>
        )}
        {find.data && matches.length === 0 && (
          <p className="text-center text-ink-300 py-4">
            Koi match nahi mila. Photos ke naam product ke naam jaise rakhein (jaise <i>tata-salt-1kg.jpg</i>) ya "Loose" try karein.
          </p>
        )}
        {error && <p className="text-xs text-chili-600">{error}</p>}
      </div>
    </Modal>
  )
}
