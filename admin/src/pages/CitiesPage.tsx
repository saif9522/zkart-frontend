import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { superAdminApi } from '@/api/superadmin'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { formatINR } from '@/lib/utils'

const emptyForm = { name: '', state: 'Jharkhand', delivery_charge: '', free_delivery_threshold: '' }

export function CitiesPage() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey: ['cities'], queryFn: superAdminApi.cities })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['cities'] })
  const create = useMutation({
    mutationFn: () =>
      superAdminApi.createCity({
        name: form.name,
        state: form.state,
        delivery_charge: form.delivery_charge || null,
        free_delivery_threshold: form.free_delivery_threshold || null,
      }),
    onSuccess: () => {
      invalidate()
      setOpen(false)
      setForm(emptyForm)
    },
  })
  const remove = useMutation({ mutationFn: superAdminApi.deleteCity, onSuccess: invalidate })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-500">Cities</h1>
          <p className="text-sm text-ink-300">Each city can override the platform's default delivery pricing.</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New city
        </Button>
      </div>

      {isLoading && <p className="text-ink-300 animate-pulse">Loading...</p>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data?.results.map((city) => (
          <div key={city.id} className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-ink-500">{city.name}</p>
                <p className="text-xs text-ink-300">{city.state}</p>
              </div>
              <button onClick={() => remove.mutate(city.id)} className="text-ink-300 hover:text-chili-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Badge status={city.is_active ? 'active' : 'inactive'} />
              <span className="bg-rice-100 border border-ink-100 rounded-full px-2.5 py-1 font-mono">
                {city.vendor_count} vendor{city.vendor_count !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="mt-3 text-xs text-ink-400 space-y-1">
              <div>
                Delivery: <span className="font-mono">{city.delivery_charge ? formatINR(city.delivery_charge) : 'platform default'}</span>
              </div>
              <div>
                Free above: <span className="font-mono">{city.free_delivery_threshold ? formatINR(city.free_delivery_threshold) : 'platform default'}</span>
              </div>
            </div>
          </div>
        ))}
        {data && data.results.length === 0 && (
          <p className="text-ink-300 col-span-full text-center py-8">No cities yet — vendors use the platform default pricing.</p>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New city">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            create.mutate()
          }}
          className="flex flex-col gap-3"
        >
          <Field label="City name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
          <Field label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Delivery charge override (₹)"
              type="number"
              placeholder="leave blank for default"
              value={form.delivery_charge}
              onChange={(e) => setForm({ ...form, delivery_charge: e.target.value })}
            />
            <Field
              label="Free delivery above (₹)"
              type="number"
              placeholder="leave blank for default"
              value={form.free_delivery_threshold}
              onChange={(e) => setForm({ ...form, free_delivery_threshold: e.target.value })}
            />
          </div>
          <Button type="submit" loading={create.isPending} className="mt-2">
            Create city
          </Button>
        </form>
      </Modal>
    </div>
  )
}
