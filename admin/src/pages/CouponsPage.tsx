import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { formatINR } from '@/lib/utils'
import type { Coupon } from '@/types'

const emptyForm = {
  code: '',
  discount_type: 'flat' as 'flat' | 'percent',
  discount_value: '',
  max_discount: '',
  min_order_value: '0',
  valid_from: '',
  valid_to: '',
  usage_limit: '',
}

export function CouponsPage() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey: ['coupons'], queryFn: adminApi.coupons })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['coupons'] })
  const create = useMutation({
    mutationFn: () =>
      adminApi.createCoupon({
        code: form.code,
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        max_discount: form.max_discount || null,
        min_order_value: form.min_order_value || '0',
        valid_from: new Date(form.valid_from).toISOString(),
        valid_to: new Date(form.valid_to).toISOString(),
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      }),
    onSuccess: () => {
      invalidate()
      setOpen(false)
      setForm(emptyForm)
    },
  })
  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => adminApi.updateCoupon(id, { is_active }),
    onSuccess: invalidate,
  })
  const remove = useMutation({ mutationFn: adminApi.deleteCoupon, onSuccess: invalidate })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-500">Coupons</h1>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New coupon
        </Button>
      </div>

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs text-ink-300">
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Discount</th>
              <th className="px-4 py-3 font-medium">Min order</th>
              <th className="px-4 py-3 font-medium">Usage</th>
              <th className="px-4 py-3 font-medium">Valid until</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-300">Loading...</td>
              </tr>
            )}
            {data?.results.map((c: Coupon) => (
              <tr key={c.id} className="border-b border-ink-100/60 last:border-0">
                <td className="px-4 py-3 font-mono font-semibold text-ink-500">{c.code}</td>
                <td className="px-4 py-3 text-ink-400">
                  {c.discount_type === 'flat' ? formatINR(c.discount_value) : `${c.discount_value}%`}
                  {c.max_discount && c.discount_type === 'percent' && (
                    <span className="text-xs text-ink-300"> (max {formatINR(c.max_discount)})</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-ink-400">{formatINR(c.min_order_value)}</td>
                <td className="px-4 py-3 font-mono text-ink-400">
                  {c.used_count}
                  {c.usage_limit ? ` / ${c.usage_limit}` : ''}
                </td>
                <td className="px-4 py-3 text-xs text-ink-300">{new Date(c.valid_to).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive.mutate({ id: c.id, is_active: !c.is_active })}>
                    <Badge status={c.is_active ? 'active' : 'inactive'} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => remove.mutate(c.id)} className="text-ink-300 hover:text-chili-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {data && data.results.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-300">No coupons yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New coupon">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            create.mutate()
          }}
          className="flex flex-col gap-3"
        >
          <Field label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-ink-400">Discount type</span>
              <select
                value={form.discount_type}
                onChange={(e) => setForm({ ...form, discount_type: e.target.value as 'flat' | 'percent' })}
                className="rounded-lg border border-ink-100 bg-rice-100 px-3 py-2 text-sm outline-none focus:border-forest-400"
              >
                <option value="flat">Flat (₹)</option>
                <option value="percent">Percent (%)</option>
              </select>
            </label>
            <Field
              label="Discount value"
              type="number"
              value={form.discount_value}
              onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Max discount (percent only)"
              type="number"
              value={form.max_discount}
              onChange={(e) => setForm({ ...form, max_discount: e.target.value })}
            />
            <Field
              label="Min order value"
              type="number"
              value={form.min_order_value}
              onChange={(e) => setForm({ ...form, min_order_value: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valid from" type="date" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} required />
            <Field label="Valid to" type="date" value={form.valid_to} onChange={(e) => setForm({ ...form, valid_to: e.target.value })} required />
          </div>
          <Field
            label="Usage limit (blank = unlimited)"
            type="number"
            value={form.usage_limit}
            onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
          />
          <Button type="submit" loading={create.isPending} className="mt-2">
            Create coupon
          </Button>
        </form>
      </Modal>
    </div>
  )
}
