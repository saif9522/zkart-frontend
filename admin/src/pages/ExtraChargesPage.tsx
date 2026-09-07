import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Clock } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { apiErrorMessage } from '@/api/client'
import type { AdminExtraCharge } from '@/types'

type Draft = Partial<AdminExtraCharge>

const BLANK: Draft = {
  code: '',
  label: '',
  charge_type: 'flat',
  amount: '',
  max_charge: null,
  min_order_value: null,
  active_from_hour: null,
  active_to_hour: null,
  is_active: true,
  display_order: 0,
}

const PRESETS: { code: string; label: string }[] = [
  { code: 'handling', label: 'Handling charge' },
  { code: 'packing', label: 'Packing charge' },
  { code: 'night', label: 'Night charge' },
  { code: 'rain', label: 'Rain charge' },
]

export function ExtraChargesPage() {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<Draft | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['extra-charges'],
    queryFn: adminApi.extraCharges,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['extra-charges'] })

  const save = useMutation({
    mutationFn: (d: Draft) =>
      d.id ? adminApi.updateExtraCharge(d.id, d) : adminApi.createExtraCharge(d),
    onSuccess: () => {
      invalidate()
      setDraft(null)
    },
    onError: (e) => alert(apiErrorMessage(e, 'Could not save the charge.')),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      adminApi.updateExtraCharge(id, { is_active }),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteExtraCharge(id),
    onSuccess: invalidate,
  })

  const charges = data?.results ?? []

  const set = (patch: Draft) => setDraft((d) => ({ ...(d ?? {}), ...patch }))

  const windowText = (c: AdminExtraCharge) =>
    c.active_from_hour != null && c.active_to_hour != null
      ? `${String(c.active_from_hour).padStart(2, '0')}:00–${String(c.active_to_hour).padStart(2, '0')}:00`
      : 'Any time'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-500">Extra charges</h1>
          <p className="text-xs text-ink-300 mt-0.5">
            Handling, packing, night, rain or custom fees. A charge only shows to customers while it is active.
          </p>
        </div>
        <button
          onClick={() => setDraft({ ...BLANK })}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-forest-600 text-rice-50 hover:bg-forest-700"
        >
          <Plus className="h-4 w-4" /> Add charge
        </button>
      </div>

      {/* Editor */}
      {draft && (
        <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.code}
                onClick={() => set({ code: p.code, label: p.label })}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-rice-100 border border-ink-100 text-ink-400 hover:bg-forest-50"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1 text-xs text-ink-300">
              Code (internal)
              <input
                value={draft.code ?? ''}
                onChange={(e) => set({ code: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                placeholder="handling"
                className="rounded-lg border border-ink-100 bg-white px-2.5 py-2 text-sm text-ink-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink-300">
              Label (shown to customer)
              <input
                value={draft.label ?? ''}
                onChange={(e) => set({ label: e.target.value })}
                placeholder="Handling charge"
                className="rounded-lg border border-ink-100 bg-white px-2.5 py-2 text-sm text-ink-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink-300">
              Type
              <select
                value={draft.charge_type ?? 'flat'}
                onChange={(e) => set({ charge_type: e.target.value as 'flat' | 'percent' })}
                className="rounded-lg border border-ink-100 bg-white px-2.5 py-2 text-sm text-ink-500"
              >
                <option value="flat">Flat ₹</option>
                <option value="percent">% of subtotal</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink-300">
              {draft.charge_type === 'percent' ? 'Percent (%)' : 'Amount (₹)'}
              <input
                type="number"
                value={draft.amount ?? ''}
                onChange={(e) => set({ amount: e.target.value })}
                className="rounded-lg border border-ink-100 bg-white px-2.5 py-2 text-sm text-ink-500"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs text-ink-300">
              Min order value (₹, optional)
              <input
                type="number"
                value={draft.min_order_value ?? ''}
                onChange={(e) => set({ min_order_value: e.target.value || null })}
                className="rounded-lg border border-ink-100 bg-white px-2.5 py-2 text-sm text-ink-500"
              />
            </label>
            {draft.charge_type === 'percent' && (
              <label className="flex flex-col gap-1 text-xs text-ink-300">
                Max cap (₹, optional)
                <input
                  type="number"
                  value={draft.max_charge ?? ''}
                  onChange={(e) => set({ max_charge: e.target.value || null })}
                  className="rounded-lg border border-ink-100 bg-white px-2.5 py-2 text-sm text-ink-500"
                />
              </label>
            )}
            <label className="flex flex-col gap-1 text-xs text-ink-300">
              Active from hour (0–23, optional)
              <input
                type="number"
                min={0}
                max={23}
                value={draft.active_from_hour ?? ''}
                onChange={(e) => set({ active_from_hour: e.target.value === '' ? null : Number(e.target.value) })}
                placeholder="e.g. 22"
                className="rounded-lg border border-ink-100 bg-white px-2.5 py-2 text-sm text-ink-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink-300">
              Active to hour (0–23, optional)
              <input
                type="number"
                min={0}
                max={23}
                value={draft.active_to_hour ?? ''}
                onChange={(e) => set({ active_to_hour: e.target.value === '' ? null : Number(e.target.value) })}
                placeholder="e.g. 6"
                className="rounded-lg border border-ink-100 bg-white px-2.5 py-2 text-sm text-ink-500"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink-400">
            <input
              type="checkbox"
              checked={draft.is_active ?? true}
              onChange={(e) => set({ is_active: e.target.checked })}
            />
            Active (uncheck to keep it saved but hidden — e.g. turn the rain charge on only when it rains)
          </label>

          <div className="flex gap-2">
            <button
              onClick={() => save.mutate(draft)}
              disabled={save.isPending || !draft.code || !draft.label || !draft.amount}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-forest-600 text-rice-50 hover:bg-forest-700 disabled:opacity-50"
            >
              {save.isPending ? 'Saving…' : 'Save charge'}
            </button>
            <button
              onClick={() => setDraft(null)}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-rice-50 border border-ink-100 text-ink-400 hover:bg-rice-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs text-ink-300">
              <th className="px-4 py-3 font-medium">Charge</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Min order</th>
              <th className="px-4 py-3 font-medium">Active</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-300">Loading…</td></tr>
            )}
            {!isLoading && charges.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-300">
                No extra charges yet. Add one — it will only appear at checkout once active.
              </td></tr>
            )}
            {charges.map((c) => (
              <tr key={c.id} className="border-b border-ink-100/60 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink-500">{c.label}</p>
                  <p className="text-[11px] text-ink-300 font-mono">{c.code}</p>
                </td>
                <td className="px-4 py-3 text-ink-400">
                  {c.charge_type === 'percent' ? `${c.amount}%${c.max_charge ? ` (max ₹${c.max_charge})` : ''}` : `₹${c.amount}`}
                </td>
                <td className="px-4 py-3 text-ink-400">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-ink-200" />
                    {windowText(c)}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-400">{c.min_order_value ? `₹${c.min_order_value}` : '—'}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive.mutate({ id: c.id, is_active: !c.is_active })}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                      c.is_active ? 'bg-forest-100 text-forest-700' : 'bg-ink-100 text-ink-300'
                    }`}
                  >
                    {c.is_active ? 'On' : 'Off'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setDraft({ ...c })}
                      className="text-xs font-semibold text-forest-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${c.label}"?`)) remove.mutate(c.id)
                      }}
                      className="text-ink-300 hover:text-chili-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
