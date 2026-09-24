import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { apiErrorMessage } from '@/api/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import type { AdminSlider } from '@/types'

const emptyForm = { title: '', subtitle: '', link_url: '' }

export function SlidersPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AdminSlider | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [formError, setFormError] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey: ['sliders'], queryFn: adminApi.sliders })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['sliders'] })

  const create = useMutation({
    mutationFn: () => {
      if (!imageFile) throw new Error('An image is required.')
      return adminApi.createSlider({ ...form, imageFile })
    },
    onSuccess: () => {
      invalidate()
      closeModal()
    },
    onError: (err) => setFormError(err instanceof Error ? err.message : apiErrorMessage(err, 'Could not create the slider.')),
  })

  const update = useMutation({
    mutationFn: () => adminApi.updateSlider(editing!.id, { ...form, ...(imageFile ? { imageFile } : {}) }),
    onSuccess: () => {
      invalidate()
      closeModal()
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'Could not save the slider.')),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => adminApi.updateSlider(id, { is_active }),
    onSuccess: invalidate,
  })

  const remove = useMutation({ mutationFn: adminApi.deleteSlider, onSuccess: invalidate })

  const closeModal = () => {
    setOpen(false)
    setEditing(null)
    setForm(emptyForm)
    setImageFile(null)
    setFormError('')
  }

  const startEdit = (s: AdminSlider) => {
    setEditing(s)
    setForm({ title: s.title, subtitle: s.subtitle, link_url: s.link_url })
    setImageFile(null)
    setFormError('')
    setOpen(true)
  }

  const sliders = data?.results ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-500">Homepage Sliders</h1>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New slider
        </Button>
      </div>

      {isLoading && <p className="text-ink-300 animate-pulse">Loading...</p>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sliders.map((s) => (
          <div key={s.id} className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 overflow-hidden">
            <img src={s.image} alt={s.title} className="h-32 w-full object-cover" />
            <div className="p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink-500 text-sm truncate">{s.title || 'Untitled'}</span>
                <button onClick={() => toggleActive.mutate({ id: s.id, is_active: !s.is_active })}>
                  <Badge status={s.is_active ? 'active' : 'inactive'} />
                </button>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => startEdit(s)} className="text-ink-300 hover:text-forest-600">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => remove.mutate(s.id)} className="text-ink-300 hover:text-chili-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {data && sliders.length === 0 && <p className="text-ink-300 text-center py-8 col-span-full">No sliders yet.</p>}
      </div>

      <Modal open={open} onClose={closeModal} title={editing ? 'Edit slider' : 'New slider'}>
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
          <Field label="Subtitle (optional)" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          <Field label="Link URL (optional)" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
          {formError && <p className="text-xs text-chili-600">{formError}</p>}
          <Button type="submit" loading={create.isPending || update.isPending} className="mt-2">
            {editing ? 'Save changes' : 'Create slider'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
