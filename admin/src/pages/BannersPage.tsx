import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { apiErrorMessage } from '@/api/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import type { AdminBanner } from '@/types'

const POSITIONS: { value: AdminBanner['position']; label: string }[] = [
  { value: 'home_top', label: 'Home — top' },
  { value: 'home_middle', label: 'Home — middle' },
  { value: 'category_page', label: 'Category page' },
  { value: 'cart_page', label: 'Cart page' },
]

const emptyForm = { title: '', link_url: '', position: 'home_top' as AdminBanner['position'] }

export function BannersPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AdminBanner | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [formError, setFormError] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey: ['banners'], queryFn: () => adminApi.banners() })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['banners'] })

  const create = useMutation({
    mutationFn: () => {
      if (!imageFile) throw new Error('An image is required.')
      return adminApi.createBanner({ ...form, imageFile })
    },
    onSuccess: () => {
      invalidate()
      closeModal()
    },
    onError: (err) => setFormError(err instanceof Error ? err.message : apiErrorMessage(err, 'Could not create the banner.')),
  })

  const update = useMutation({
    mutationFn: () => adminApi.updateBanner(editing!.id, { ...form, ...(imageFile ? { imageFile } : {}) }),
    onSuccess: () => {
      invalidate()
      closeModal()
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'Could not save the banner.')),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => adminApi.updateBanner(id, { is_active }),
    onSuccess: invalidate,
  })

  const remove = useMutation({ mutationFn: adminApi.deleteBanner, onSuccess: invalidate })

  const closeModal = () => {
    setOpen(false)
    setEditing(null)
    setForm(emptyForm)
    setImageFile(null)
    setFormError('')
  }

  const startEdit = (b: AdminBanner) => {
    setEditing(b)
    setForm({ title: b.title, link_url: b.link_url, position: b.position })
    setImageFile(null)
    setFormError('')
    setOpen(true)
  }

  const banners = data?.results ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-500">Banners</h1>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New banner
        </Button>
      </div>

      {isLoading && <p className="text-ink-300 animate-pulse">Loading...</p>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {banners.map((b) => (
          <div key={b.id} className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 overflow-hidden">
            <img src={b.image} alt={b.title} className="h-28 w-full object-cover" />
            <div className="p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink-500 text-sm truncate">{b.title || 'Untitled'}</span>
                <button onClick={() => toggleActive.mutate({ id: b.id, is_active: !b.is_active })}>
                  <Badge status={b.is_active ? 'active' : 'inactive'} />
                </button>
              </div>
              <p className="text-xs text-ink-300 mt-1">{POSITIONS.find((p) => p.value === b.position)?.label}</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => startEdit(b)} className="text-ink-300 hover:text-forest-600">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => remove.mutate(b.id)} className="text-ink-300 hover:text-chili-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {data && banners.length === 0 && <p className="text-ink-300 text-center py-8 col-span-full">No banners yet.</p>}
      </div>

      <Modal open={open} onClose={closeModal} title={editing ? 'Edit banner' : 'New banner'}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            editing ? update.mutate() : create.mutate()
          }}
          className="flex flex-col gap-3"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-400">Image {editing ? '(leave blank to keep current)' : ''}</span>
            <label className="flex items-center gap-2 rounded-lg border border-dashed border-ink-100 px-3 py-2 text-sm text-ink-400 cursor-pointer hover:border-forest-400">
              <ImagePlus className="h-4 w-4" />
              {imageFile ? imageFile.name : 'Choose image'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
            </label>
          </label>
          <Field label="Title (optional)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-400">Position</span>
            <select
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value as AdminBanner['position'] })}
              className="rounded-lg border border-ink-100 bg-rice-100 px-3 py-2 text-sm outline-none focus:border-forest-400"
            >
              {POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <Field label="Link URL (optional)" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
          {formError && <p className="text-xs text-chili-600">{formError}</p>}
          <Button type="submit" loading={create.isPending || update.isPending} className="mt-2">
            {editing ? 'Save changes' : 'Create banner'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
