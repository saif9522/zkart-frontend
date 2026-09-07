import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { apiErrorMessage } from '@/api/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import type { AdminOffer } from '@/types'

const emptyForm = { title: '', description: '', discount_label: '', link_url: '' }

export function OffersPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AdminOffer | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [formError, setFormError] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey: ['offers'], queryFn: adminApi.offers })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['offers'] })

  const create = useMutation({
    mutationFn: () => adminApi.createOffer({ ...form, ...(imageFile ? { imageFile } : {}) }),
    onSuccess: () => {
      invalidate()
      closeModal()
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'Could not create the offer.')),
  })

  const update = useMutation({
    mutationFn: () => adminApi.updateOffer(editing!.id, { ...form, ...(imageFile ? { imageFile } : {}) }),
    onSuccess: () => {
      invalidate()
      closeModal()
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'Could not save the offer.')),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => adminApi.updateOffer(id, { is_active }),
    onSuccess: invalidate,
  })

  const remove = useMutation({ mutationFn: adminApi.deleteOffer, onSuccess: invalidate })

  const closeModal = () => {
    setOpen(false)
    setEditing(null)
    setForm(emptyForm)
    setImageFile(null)
    setFormError('')
  }

  const startCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setImageFile(null)
    setFormError('')
    setOpen(true)
  }

  const startEdit = (o: AdminOffer) => {
    setEditing(o)
    setForm({ title: o.title, description: o.description, discount_label: o.discount_label, link_url: o.link_url })
    setImageFile(null)
    setFormError('')
    setOpen(true)
  }

  const offers = data?.results ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-500">Offers</h1>
        <Button size="sm" onClick={startCreate}>
          <Plus className="h-4 w-4" /> New offer
        </Button>
      </div>

      {isLoading && <p className="text-ink-300 animate-pulse">Loading...</p>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {offers.map((o) => (
          <div key={o.id} className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 overflow-hidden">
            {o.image && <img src={o.image} alt={o.title} className="h-24 w-full object-cover" />}
            <div className="p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink-500 text-sm truncate">{o.title}</span>
                <button onClick={() => toggleActive.mutate({ id: o.id, is_active: !o.is_active })}>
                  <Badge status={o.is_active ? 'active' : 'inactive'} />
                </button>
              </div>
              {o.discount_label && <p className="text-xs text-forest-600 font-semibold mt-0.5">{o.discount_label}</p>}
              {o.description && <p className="text-xs text-ink-300 mt-1 line-clamp-2">{o.description}</p>}
              <div className="flex gap-2 mt-2">
                <button onClick={() => startEdit(o)} className="text-ink-300 hover:text-forest-600">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => remove.mutate(o.id)} className="text-ink-300 hover:text-chili-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {data && offers.length === 0 && <p className="text-ink-300 text-center py-8 col-span-full">No offers yet.</p>}
      </div>

      <Modal open={open} onClose={closeModal} title={editing ? 'Edit offer' : 'New offer'}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            editing ? update.mutate() : create.mutate()
          }}
          className="flex flex-col gap-3"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-400">Image (optional)</span>
            <label className="flex items-center gap-2 rounded-lg border border-dashed border-ink-100 px-3 py-2 text-sm text-ink-400 cursor-pointer hover:border-forest-400">
              <ImagePlus className="h-4 w-4" />
              {imageFile ? imageFile.name : 'Choose image'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
            </label>
          </label>
          <Field label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required autoFocus />
          <Field
            label="Discount label (e.g. 'Up to 50% off')"
            value={form.discount_label}
            onChange={(e) => setForm({ ...form, discount_label: e.target.value })}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-400">Description (optional)</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-forest-400 resize-none"
            />
          </label>
          <Field label="Link URL (optional)" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
          {formError && <p className="text-xs text-chili-600">{formError}</p>}
          <Button type="submit" loading={create.isPending || update.isPending} className="mt-2">
            {editing ? 'Save changes' : 'Create offer'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
