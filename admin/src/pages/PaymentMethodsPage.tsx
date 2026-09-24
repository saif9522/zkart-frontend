import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { apiErrorMessage } from '@/api/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import type { AdminPaymentMethodConfig } from '@/types'

const CODES: { value: AdminPaymentMethodConfig['code']; label: string }[] = [
  { value: 'cod', label: 'Cash on delivery' },
  { value: 'razorpay', label: 'Razorpay (Card/UPI/Netbanking)' },
]

const emptyForm = { code: 'cod' as AdminPaymentMethodConfig['code'], label: '', extra_fee: '0', min_order_value: '' }

export function PaymentMethodsPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AdminPaymentMethodConfig | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey: ['admin-payment-methods'], queryFn: adminApi.paymentMethods })
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] })

  const create = useMutation({
    mutationFn: () =>
      adminApi.createPaymentMethod({
        code: form.code,
        label: form.label,
        extra_fee: form.extra_fee || '0',
        min_order_value: form.min_order_value || null,
      }),
    onSuccess: () => {
      invalidate()
      closeModal()
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'Could not save. A config for this method may already exist.')),
  })

  const update = useMutation({
    mutationFn: () =>
      adminApi.updatePaymentMethod(editing!.id, {
        label: form.label,
        extra_fee: form.extra_fee || '0',
        min_order_value: form.min_order_value || null,
      }),
    onSuccess: () => {
      invalidate()
      closeModal()
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'Could not save changes.')),
  })

  const toggleEnabled = useMutation({
    mutationFn: ({ id, is_enabled }: { id: string; is_enabled: boolean }) =>
      adminApi.updatePaymentMethod(id, { is_enabled }),
    onSuccess: invalidate,
  })

  const remove = useMutation({ mutationFn: adminApi.deletePaymentMethod, onSuccess: invalidate })

  const closeModal = () => {
    setOpen(false)
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
  }

  const startEdit = (m: AdminPaymentMethodConfig) => {
    setEditing(m)
    setForm({ code: m.code, label: m.label, extra_fee: m.extra_fee, min_order_value: m.min_order_value ?? '' })
    setFormError('')
    setOpen(true)
  }

  const configured = data?.results ?? []
  const configuredCodes = new Set(configured.map((m) => m.code))
  const unconfigured = CODES.filter((c) => !configuredCodes.has(c.value))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-500">Payment Methods</h1>
        {unconfigured.length > 0 && (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null)
              setForm({ ...emptyForm, code: unconfigured[0].value })
              setFormError('')
              setOpen(true)
            }}
          >
            <Plus className="h-4 w-4" /> Configure a method
          </Button>
        )}
      </div>
      <p className="text-xs text-ink-300 -mt-2">
        A method with no configuration here is available by default with no restrictions.
      </p>

      {isLoading && <p className="text-ink-300 animate-pulse">Loading...</p>}

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 divide-y divide-ink-100/60">
        {CODES.map((c) => {
          const config = configured.find((m) => m.code === c.value)
          return (
            <div key={c.value} className="flex items-center gap-3 p-3.5">
              <div className="flex-1">
                <p className="font-semibold text-ink-500 text-sm">{config?.label || c.label}</p>
                {config && (
                  <p className="text-xs text-ink-300">
                    {Number(config.extra_fee) > 0 && `Fee: ₹${config.extra_fee} · `}
                    {config.min_order_value ? `Min order: ₹${config.min_order_value}` : 'No minimum'}
                  </p>
                )}
                {!config && <p className="text-xs text-ink-300">Default — no restrictions configured</p>}
              </div>
              {config ? (
                <>
                  <button onClick={() => toggleEnabled.mutate({ id: config.id, is_enabled: !config.is_enabled })}>
                    <Badge status={config.is_enabled ? 'active' : 'inactive'} label={config.is_enabled ? 'Enabled' : 'Disabled'} />
                  </button>
                  <button onClick={() => startEdit(config)} className="text-ink-300 hover:text-forest-600">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove.mutate(config.id)} className="text-ink-300 hover:text-chili-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <Badge status="active" label="Available" />
              )}
            </div>
          )
        })}
      </div>

      <Modal open={open} onClose={closeModal} title={editing ? 'Edit payment method' : 'Configure payment method'}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            editing ? update.mutate() : create.mutate()
          }}
          className="flex flex-col gap-3"
        >
          {!editing && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-ink-400">Method</span>
              <select
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value as AdminPaymentMethodConfig['code'] })}
                className="rounded-lg border border-ink-100 bg-rice-100 px-3 py-2 text-sm outline-none focus:border-forest-400"
              >
                {unconfigured.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <Field
            label="Display label (optional — leave blank for default)"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
          />
          <Field
            label="Extra fee (₹, optional)"
            type="number"
            value={form.extra_fee}
            onChange={(e) => setForm({ ...form, extra_fee: e.target.value })}
          />
          <Field
            label="Minimum order value (₹, optional)"
            type="number"
            value={form.min_order_value}
            onChange={(e) => setForm({ ...form, min_order_value: e.target.value })}
          />
          {formError && <p className="text-xs text-chili-600">{formError}</p>}
          <Button type="submit" loading={create.isPending || update.isPending} className="mt-2">
            {editing ? 'Save changes' : 'Save configuration'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
