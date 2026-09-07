import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { apiErrorMessage } from '@/api/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import type { AdminFooterLink } from '@/types'

const SECTIONS: { value: AdminFooterLink['section']; label: string }[] = [
  { value: 'about', label: 'About' },
  { value: 'quick_links', label: 'Quick Links' },
  { value: 'customer_support', label: 'Customer Support' },
  { value: 'social', label: 'Social Media' },
]

const emptyForm = { label: '', url: '', section: 'quick_links' as AdminFooterLink['section'] }

export function FooterLinksPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AdminFooterLink | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey: ['admin-footer-links'], queryFn: () => adminApi.footerLinks() })
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-footer-links'] })

  const create = useMutation({
    mutationFn: () => adminApi.createFooterLink(form),
    onSuccess: () => {
      invalidate()
      closeModal()
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'Could not create the link.')),
  })

  const update = useMutation({
    mutationFn: () => adminApi.updateFooterLink(editing!.id, form),
    onSuccess: () => {
      invalidate()
      closeModal()
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'Could not save the link.')),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => adminApi.updateFooterLink(id, { is_active }),
    onSuccess: invalidate,
  })

  const remove = useMutation({ mutationFn: adminApi.deleteFooterLink, onSuccess: invalidate })

  const closeModal = () => {
    setOpen(false)
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
  }

  const startCreate = (section: AdminFooterLink['section']) => {
    setEditing(null)
    setForm({ ...emptyForm, section })
    setFormError('')
    setOpen(true)
  }

  const startEdit = (link: AdminFooterLink) => {
    setEditing(link)
    setForm({ label: link.label, url: link.url, section: link.section })
    setFormError('')
    setOpen(true)
  }

  const links = data?.results ?? []

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-ink-500">Footer Links</h1>

      {isLoading && <p className="text-ink-300 animate-pulse">Loading...</p>}

      {SECTIONS.map(({ value, label }) => (
        <div key={value}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-ink-400">{label}</h2>
            <Button size="sm" variant="ghost" onClick={() => startCreate(value)}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
          <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 divide-y divide-ink-100/60">
            {links.filter((l) => l.section === value).map((link) => (
              <div key={link.id} className="flex items-center gap-3 p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-500">{link.label}</p>
                  <p className="text-xs text-ink-300 truncate">{link.url}</p>
                </div>
                <button onClick={() => toggleActive.mutate({ id: link.id, is_active: !link.is_active })}>
                  <Badge status={link.is_active ? 'active' : 'inactive'} />
                </button>
                <button onClick={() => startEdit(link)} className="text-ink-300 hover:text-forest-600">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => remove.mutate(link.id)} className="text-ink-300 hover:text-chili-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {data && links.filter((l) => l.section === value).length === 0 && (
              <p className="text-ink-300 text-center py-4 text-sm">No links in this section.</p>
            )}
          </div>
        </div>
      ))}

      <Modal open={open} onClose={closeModal} title={editing ? 'Edit link' : 'New link'}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            editing ? update.mutate() : create.mutate()
          }}
          className="flex flex-col gap-3"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-400">Section</span>
            <select
              value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value as AdminFooterLink['section'] })}
              className="rounded-lg border border-ink-100 bg-rice-100 px-3 py-2 text-sm outline-none focus:border-forest-400"
            >
              {SECTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <Field label="Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required autoFocus />
          <Field
            label="URL (e.g. /page/about-us or https://instagram.com/...)"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            required
          />
          {formError && <p className="text-xs text-chili-600">{formError}</p>}
          <Button type="submit" loading={create.isPending || update.isPending} className="mt-2">
            {editing ? 'Save changes' : 'Add link'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
