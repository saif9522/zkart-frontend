import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { addressApi } from '@/api/addresses'
import { apiErrorMessage } from '@/api/client'
import { useAuthStore } from '@/store/auth'
import { useToastStore } from '@/store/toast'
import { Button } from '@/components/ui/Button'
import { LocationPickerMap } from '@/components/ui/LocationPickerMap'
import type { Address } from '@/types'

const emptyForm = {
  label: 'home' as Address['label'],
  address_line: '',
  landmark: '',
  city: 'Garhwa',
  state: 'Jharkhand',
  pincode: '',
  latitude: '24.1553',
  longitude: '83.8099',
  is_default: false,
}

export function AddressesPage() {
  const isAuthed = !!useAuthStore((s) => s.accessToken)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const pushToast = useToastStore((s) => s.push)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: addressApi.list,
    enabled: isAuthed,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['addresses'] })
  const onError = (err: unknown) => pushToast(apiErrorMessage(err, 'Could not update your addresses.'))

  const create = useMutation({
    mutationFn: () => addressApi.create(form),
    onSuccess: () => {
      invalidate()
      resetForm()
    },
    onError,
  })

  const update = useMutation({
    mutationFn: () => addressApi.update(editingId!, form),
    onSuccess: () => {
      invalidate()
      resetForm()
    },
    onError,
  })

  const remove = useMutation({
    mutationFn: (id: string) => addressApi.remove(id),
    onSuccess: invalidate,
    onError,
  })

  const setDefault = useMutation({
    mutationFn: (id: string) => addressApi.update(id, { is_default: true }),
    onSuccess: invalidate,
    onError,
  })

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  const startEdit = (addr: Address) => {
    setForm({
      label: addr.label,
      address_line: addr.address_line,
      landmark: addr.landmark,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      latitude: addr.latitude,
      longitude: addr.longitude,
      is_default: addr.is_default,
    })
    setEditingId(addr.id)
    setShowForm(true)
  }

  if (!isAuthed) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <MapPin className="h-12 w-12 text-ink-200 mx-auto" />
        <p className="text-ink-400 font-medium mt-4">Log in to see your addresses</p>
        <Button onClick={() => navigate('/login')} className="mt-4">
          Log in
        </Button>
      </div>
    )
  }

  const list = addresses ?? []

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      <h1 className="font-display text-xl font-semibold text-ink-500 mb-4">Saved addresses</h1>

      {isLoading ? (
        <p className="text-ink-300 animate-pulse">Loading...</p>
      ) : (
        <div className="flex flex-col gap-2 mb-4">
          {list.map((addr) => (
            <div key={addr.id} className="rounded-xl bg-rice-50 border border-ink-100/60 p-3 flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-forest-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-ink-500 capitalize">{addr.label}</span>
                  {addr.is_default && (
                    <span className="text-[10px] font-bold uppercase text-forest-600 bg-forest-50 px-1.5 py-0.5 rounded">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-300 mt-0.5">
                  {addr.address_line}
                  {addr.landmark ? `, ${addr.landmark}` : ''}, {addr.city} - {addr.pincode}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div className="flex gap-2">
                  <button onClick={() => startEdit(addr)} className="text-ink-200 hover:text-forest-600">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove.mutate(addr.id)} className="text-ink-200 hover:text-chili-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {!addr.is_default && (
                  <button
                    onClick={() => setDefault.mutate(addr.id)}
                    className="flex items-center gap-1 text-[11px] text-ink-300 hover:text-forest-600"
                  >
                    <Star className="h-3 w-3" /> Set default
                  </button>
                )}
              </div>
            </div>
          ))}
          {list.length === 0 && <p className="text-sm text-ink-300 text-center py-6">No saved addresses yet.</p>}
        </div>
      )}

      {showForm ? (
        <div className="rounded-xl border border-ink-100 bg-rice-50 p-3 flex flex-col gap-2">
          <select
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value as Address['label'] })}
            className="rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-forest-400 bg-rice-50"
          >
            <option value="home">Home</option>
            <option value="work">Work</option>
            <option value="other">Other</option>
          </select>
          <input
            placeholder="House no., street, area"
            value={form.address_line}
            onChange={(e) => setForm({ ...form, address_line: e.target.value })}
            className="rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-forest-400"
          />
          <input
            placeholder="Landmark (optional)"
            value={form.landmark}
            onChange={(e) => setForm({ ...form, landmark: e.target.value })}
            className="rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-forest-400"
          />
          <div className="flex gap-2">
            <input
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="flex-1 rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-forest-400"
            />
            <input
              placeholder="Pincode"
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              className="w-28 rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-forest-400"
            />
          </div>
          <LocationPickerMap
            latitude={Number(form.latitude)}
            longitude={Number(form.longitude)}
            onChange={(lat, lng) => setForm({ ...form, latitude: lat.toFixed(6), longitude: lng.toFixed(6) })}
          />
          <label className="flex items-center gap-2 text-xs text-ink-400 mt-1">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
              className="accent-forest-600"
            />
            Set as default address
          </label>
          <div className="flex gap-2 mt-1">
            <Button
              size="sm"
              onClick={() => (editingId ? update.mutate() : create.mutate())}
              loading={create.isPending || update.isPending}
              disabled={!form.address_line || !form.pincode || !form.city}
            >
              {editingId ? 'Save changes' : 'Add address'}
            </Button>
            <Button size="sm" variant="ghost" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-sm text-forest-600 font-medium py-1"
        >
          <Plus className="h-4 w-4" /> Add new address
        </button>
      )}
    </div>
  )
}
