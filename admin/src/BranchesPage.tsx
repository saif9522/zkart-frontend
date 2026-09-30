import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Eye, MapPin, Pencil, Plus, Store, Trash2 } from 'lucide-react'
import { LocationPickerMap } from '@/components/ui/LocationPickerMap'
import { adminApi } from '@/api/admin'
import { apiErrorMessage } from '@/api/client'
import { AddressLocationFinder } from '@/components/AddressLocationFinder'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { inIndia } from '@/lib/inIndia'
import type { AdminBranch } from '@/types'

const empty = { code: '', name: '', address_line: '', city: '', state: '', pincode: '', latitude: '', longitude: '', is_active: true }

/** Branches (Zepto-style dark-store areas): code + name + exact address on the map. Shops pick one. */
export function BranchesPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AdminBranch | null>(null)
  const [f, setF] = useState(empty)
  const [error, setError] = useState('')
  const [viewing, setViewing] = useState<AdminBranch | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ['branches'], queryFn: adminApi.branches })
  const rows = data?.results ?? []
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['branches'] })
    queryClient.invalidateQueries({ queryKey: ['vendors'] })
  }

  const save = useMutation({
    mutationFn: () => {
      const payload = { ...f, code: f.code.trim() || undefined } as Partial<AdminBranch>
      return editing ? adminApi.updateBranch(editing.id, payload) : adminApi.createBranch(payload)
    },
    onSuccess: () => {
      invalidate()
      close()
    },
    onError: (e) => setError(apiErrorMessage(e, 'Could not save the branch.')),
  })
  const remove = useMutation({ mutationFn: adminApi.deleteBranch, onSuccess: invalidate, onError: (e) => setError(apiErrorMessage(e, 'Delete failed.')) })

  const close = () => {
    setOpen(false)
    setEditing(null)
    setF(empty)
    setError('')
  }
  const startEdit = (b: AdminBranch) => {
    setEditing(b)
    setF({ code: b.code, name: b.name, address_line: b.address_line, city: b.city, state: b.state, pincode: b.pincode,
      latitude: String(b.latitude), longitude: String(b.longitude), is_active: b.is_active })
    setError('')
    setOpen(true)
  }
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })
  const locOk = inIndia(Number(f.latitude), Number(f.longitude))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-ink-500">Branches</h1>
          <p className="text-xs text-ink-300">
            Branch = code + naam + map pe sahi address. Dukaandar apni branch chunte hain; branch ke 10 km ke andar ke address pe delivery hoti hai.
          </p>
        </div>
        <Button size="sm" onClick={() => { close(); setOpen(true) }}>
          <Plus className="h-4 w-4" /> New branch
        </Button>
      </div>
      {error && !open && <p className="text-sm text-chili-600">{error}</p>}
      {isLoading && <p className="text-ink-300 animate-pulse">Loading...</p>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.map((b) => (
          <div key={b.id} className={`rounded-[var(--radius-card)] border bg-rice-50 p-3 flex flex-col gap-1.5 ${b.is_active ? 'border-ink-100/60' : 'border-ink-100/60 opacity-60'}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-forest-700 bg-forest-50 rounded px-2 py-0.5">#{b.code}</span>
              <div className="flex gap-3">
                <button onClick={() => setViewing(b)} className="text-ink-300 hover:text-forest-600" aria-label="View"><Eye className="h-4 w-4" /></button>
                <button onClick={() => startEdit(b)} className="text-ink-300 hover:text-forest-600" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                <button
                  onClick={() => window.confirm(b.vendor_count ? `${b.vendor_count} dukaan is branch mein hain — wo bina branch ke ho jaayengi. Delete karein?` : `Delete branch ${b.code}?`) && remove.mutate(b.id)}
                  className="text-ink-300 hover:text-chili-500"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="font-semibold text-ink-500">{b.name}</p>
            <p className="text-xs text-ink-400 flex gap-1"><MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />{[b.address_line, b.city, b.pincode].filter(Boolean).join(', ')}</p>
            <p className="text-xs text-ink-300 flex items-center gap-1"><Store className="h-3.5 w-3.5" />{b.vendor_count} dukaan{!b.is_active && ' · inactive'}</p>
          </div>
        ))}
        {data && rows.length === 0 && <p className="text-ink-300 text-center py-8 col-span-full">Abhi koi branch nahi — "New branch" se banayein.</p>}
      </div>

      <BranchView branch={viewing} onClose={() => setViewing(null)} onEdit={(b) => { setViewing(null); startEdit(b) }} />

      <Modal open={open} onClose={close} title={editing ? `Edit branch #${editing.code}` : 'New branch'}>
        <form onSubmit={(e) => { e.preventDefault(); setError(''); if (!locOk) return setError('Map pe branch ki sahi jagah chunein.'); save.mutate() }} className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Code (khaali = apne-aap)" value={f.code} onChange={set('code')} placeholder="00003" />
            <div className="col-span-2">
              <Field label="Branch name" value={f.name} onChange={set('name')} required placeholder="Jamia Nagar" />
            </div>
          </div>
          <Field label="Full address" value={f.address_line} onChange={set('address_line')} required placeholder="Shop no., street, area, landmark" />
          <div className="grid grid-cols-3 gap-3">
            <Field label="City" value={f.city} onChange={set('city')} />
            <Field label="State" value={f.state} onChange={set('state')} />
            <Field label="Pincode" value={f.pincode} onChange={set('pincode')} />
          </div>
          <AddressLocationFinder
            label="Branch location on map"
            address={{ line: f.address_line, city: f.city, state: f.state, pincode: f.pincode }}
            latitude={f.latitude}
            longitude={f.longitude}
            onChange={(lat, lng) => setF((x) => ({ ...x, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }))}
            onPlace={(pl) =>
              setF((x) => {
                const parts = pl.detail.split(',').map((p) => p.trim()).filter(Boolean)
                const pinIdx = parts.findIndex((p) => /^\d{6}$/.test(p))
                return {
                  ...x,
                  pincode: x.pincode || (pinIdx >= 0 ? parts[pinIdx] : ''),
                  state: x.state || (pinIdx > 0 ? parts[pinIdx - 1] : ''),
                  city: x.city || (pinIdx > 1 ? parts[pinIdx - 2] : ''),
                }
              })
            }
          />
          <label className="flex items-center gap-2 text-sm text-ink-500">
            <input type="checkbox" className="accent-forest-600" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} />
            Active (dukaandaar ise chun sakein)
          </label>
          {error && <p className="text-xs text-chili-600">{error}</p>}
          <Button type="submit" loading={save.isPending}>{editing ? 'Save changes' : 'Create branch'}</Button>
        </form>
      </Modal>
    </div>
  )
}

/** Read-only view: details, pin on the map, and the shops in this branch. */
function BranchView({ branch, onClose, onEdit }: { branch: AdminBranch | null; onClose: () => void; onEdit: (b: AdminBranch) => void }) {
  const { data: shops, isLoading } = useQuery({
    queryKey: ['vendors', 'by-branch', branch?.id],
    queryFn: () => adminApi.vendors({ branch: branch!.id, page_size: 200 }),
    enabled: !!branch,
  })
  if (!branch) return null
  const lat = Number(branch.latitude)
  const lng = Number(branch.longitude)
  return (
    <Modal open={!!branch} onClose={onClose} title={`Branch #${branch.code}`}>
      <div className="flex flex-col gap-3 text-sm">
        <div>
          <p className="text-lg font-bold text-ink-500">{branch.name}</p>
          <p className="text-ink-400 flex gap-1 mt-0.5">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
            {[branch.address_line, branch.city, branch.state, branch.pincode].filter(Boolean).join(', ')}
          </p>
          <p className="text-xs text-ink-300 mt-1 font-mono">
            {lat.toFixed(6)}, {lng.toFixed(6)} · {branch.is_active ? 'Active' : 'Inactive'}
          </p>
        </div>
        <LocationPickerMap latitude={lat} longitude={lng} onChange={() => {}} />
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
          target="_blank"
          rel="noreferrer"
          className="self-start inline-flex items-center gap-1 text-xs font-semibold text-forest-700"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Google Maps mein kholo
        </a>
        <div>
          <p className="text-xs font-semibold text-ink-400 mb-1.5">Dukaanen is branch mein ({shops?.count ?? branch.vendor_count})</p>
          {isLoading && <p className="text-ink-300 animate-pulse text-xs">Loading...</p>}
          <ul className="rounded-lg border border-ink-100 divide-y divide-ink-100/60 max-h-56 overflow-y-auto">
            {shops?.results.map((v) => (
              <li key={v.id} className="px-3 py-2 flex items-center justify-between gap-2">
                <span className="min-w-0">
                  <span className="block font-medium text-ink-500 truncate">{v.shop_name}</span>
                  <span className="block text-[11px] text-ink-300 truncate">
                    {v.owner_phone} · {v.city}
                    {v.service_pincodes ? ` · pincodes ${v.service_pincodes}` : ''}
                  </span>
                </span>
                <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${v.status === 'approved' ? 'bg-forest-100 text-forest-700' : 'bg-ink-100 text-ink-400'}`}>
                  {v.status}
                </span>
              </li>
            ))}
            {shops && shops.results.length === 0 && (
              <li className="px-3 py-3 text-xs text-ink-300">Abhi koi dukaan nahi. Vendors → Edit mein ye branch chunein.</li>
            )}
          </ul>
        </div>
        <Button variant="outline" onClick={() => onEdit(branch)}>
          <Pencil className="h-4 w-4" /> Edit this branch
        </Button>
      </div>
    </Modal>
  )
}
