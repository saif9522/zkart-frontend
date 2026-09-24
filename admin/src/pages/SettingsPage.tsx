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
    delivery_free_km: '',
    delivery_per_km_charge: '',
    max_delivery_radius_km: '',
    rider_payout_base: '',
    rider_payout_per_km: '',
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
        delivery_free_km: data.delivery_free_km,
        delivery_per_km_charge: data.delivery_per_km_charge,
        max_delivery_radius_km: data.max_delivery_radius_km,
        rider_payout_base: data.rider_payout_base,
        rider_payout_per_km: data.rider_payout_per_km,
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
        <h2 className="text-sm font-semibold text-ink-500 pt-2 border-t border-ink-100">Distance pricing (customer pays)</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Base charge covers first (km)"
            type="number"
            step="0.1"
            value={form.delivery_free_km}
            onChange={(e) => setForm({ ...form, delivery_free_km: e.target.value })}
          />
          <Field
            label="Extra charge per km after that (₹)"
            type="number"
            step="0.5"
            value={form.delivery_per_km_charge}
            onChange={(e) => setForm({ ...form, delivery_per_km_charge: e.target.value })}
          />
        </div>
        <Field
          label="Max delivery distance (km) — farther shops blocked at checkout"
          type="number"
          step="0.5"
          value={form.max_delivery_radius_km}
          onChange={(e) => setForm({ ...form, max_delivery_radius_km: e.target.value })}
        />

        <h2 className="text-sm font-semibold text-ink-500 pt-2 border-t border-ink-100">Delivery partner payout (rider earns)</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Per delivered order (₹)"
            type="number"
            step="0.5"
            value={form.rider_payout_base}
            onChange={(e) => setForm({ ...form, rider_payout_base: e.target.value })}
          />
          <Field
            label="Extra per km beyond free km (₹, 0 = flat)"
            type="number"
            step="0.5"
            value={form.rider_payout_per_km}
            onChange={(e) => setForm({ ...form, rider_payout_per_km: e.target.value })}
          />
        </div>
        <p className="text-xs text-ink-300 -mt-2">
          Example: ₹{form.rider_payout_base || 0} + ₹{form.rider_payout_per_km || 0}/km after {form.delivery_free_km || 0} km → a 5 km
          delivery pays ₹
          {(
            Number(form.rider_payout_base || 0) +
            Math.max(0, 5 - Number(form.delivery_free_km || 0)) * Number(form.rider_payout_per_km || 0)
          ).toFixed(0)}
          .
        </p>

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
