import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { superAdminApi } from '@/api/superadmin'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'

export function SettingsPage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['platform-settings'], queryFn: superAdminApi.getSettings })

  const [form, setForm] = useState({
    default_commission_percent: '',
    default_delivery_charge: '',
    default_free_delivery_threshold: '',
    order_accept_timeout_minutes: '',
    maintenance_mode: false,
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (data) {
      setForm({
        default_commission_percent: data.default_commission_percent,
        default_delivery_charge: data.default_delivery_charge,
        default_free_delivery_threshold: data.default_free_delivery_threshold,
        order_accept_timeout_minutes: String(data.order_accept_timeout_minutes),
        maintenance_mode: data.maintenance_mode,
      })
    }
  }, [data])

  const save = useMutation({
    mutationFn: () =>
      superAdminApi.updateSettings({
        ...form,
        order_accept_timeout_minutes: Number(form.order_accept_timeout_minutes),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  if (isLoading) return <p className="text-ink-300 animate-pulse">Loading...</p>

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <div>
        <h1 className="text-xl font-bold text-ink-500">Platform Settings</h1>
        <p className="text-sm text-ink-300">
          Defaults applied platform-wide. A city with its own delivery pricing (see Cities) overrides these.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate()
        }}
        className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-5 flex flex-col gap-4"
      >
        <Field
          label="Default commission (%)"
          type="number"
          value={form.default_commission_percent}
          onChange={(e) => setForm({ ...form, default_commission_percent: e.target.value })}
        />
        <Field
          label="Default delivery charge (₹)"
          type="number"
          value={form.default_delivery_charge}
          onChange={(e) => setForm({ ...form, default_delivery_charge: e.target.value })}
        />
        <Field
          label="Free delivery above (₹)"
          type="number"
          value={form.default_free_delivery_threshold}
          onChange={(e) => setForm({ ...form, default_free_delivery_threshold: e.target.value })}
        />
        <Field
          label="Order acceptance timeout (minutes)"
          type="number"
          value={form.order_accept_timeout_minutes}
          onChange={(e) => setForm({ ...form, order_accept_timeout_minutes: e.target.value })}
        />
        <label className="flex items-center gap-2.5 text-sm text-ink-500">
          <input
            type="checkbox"
            checked={form.maintenance_mode}
            onChange={(e) => setForm({ ...form, maintenance_mode: e.target.checked })}
            className="accent-forest-600 h-4 w-4"
          />
          Maintenance mode
        </label>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={save.isPending}>
            Save settings
          </Button>
          {saved && <span className="text-sm text-forest-600 font-medium">Saved ✓</span>}
        </div>
      </form>
    </div>
  )
}
