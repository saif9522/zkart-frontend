import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { apiErrorMessage } from '@/api/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import type { AdminPage } from '@/types'

const emptyForm = { title: '', content: '' }

export function PagesPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AdminPage | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey: ['admin-pages'], queryFn: adminApi.pages })
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-pages'] })

  const create = useMutation({
    mutationFn: () => adminApi.createPage(form),
    onSuccess: () => {
      invalidate()
      closeModal()
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'Could not create the page.')),
  })

  const update = useMutation({
    mutationFn: () => adminApi.updatePage(editing!.id, form),
    onSuccess: () => {
      invalidate()
      closeModal()
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'Could not save the page.')),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => adminApi.updatePage(id, { is_active }),
    onSuccess: invalidate,
  })

  const remove = useMutation({ mutationFn: adminApi.deletePage, onSuccess: invalidate })

  const closeModal = () => {
    setOpen(false)
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
  }

  const startEdit = (page: AdminPage) => {
    setEditing(page)
    setForm({ title: page.title, content: page.content })
    setFormError('')
    setOpen(true)
  }

  const pages = data?.results ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-500">Pages</h1>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New page
        </Button>
      </div>
      <p className="text-xs text-ink-300 -mt-2">e.g. About Us, Privacy Policy, Terms & Conditions, Refund Policy</p>

      {isLoading && <p className="text-ink-300 animate-pulse">Loading...</p>}

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 divide-y divide-ink-100/60">
        {pages.map((page) => (
          <div key={page.id} className="flex items-center gap-3 p-3.5">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-ink-500 text-sm">{page.title}</p>
              <p className="text-xs text-ink-300 font-mono">/page/{page.slug}</p>
            </div>
            <button onClick={() => toggleActive.mutate({ id: page.id, is_active: !page.is_active })}>
              <Badge status={page.is_active ? 'active' : 'inactive'} />
            </button>
            <button onClick={() => startEdit(page)} className="text-ink-300 hover:text-forest-600">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => remove.mutate(page.id)} className="text-ink-300 hover:text-chili-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {data && pages.length === 0 && <p className="text-ink-300 text-center py-8">No pages yet.</p>}
      </div>

      <Modal open={open} onClose={closeModal} title={editing ? 'Edit page' : 'New page'}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            editing ? update.mutate() : create.mutate()
          }}
          className="flex flex-col gap-3"
        >
          <Field label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required autoFocus />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-400">Content</span>
            <textarea
              required
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={8}
              className="rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-forest-400 resize-none font-mono"
            />
          </label>
          {formError && <p className="text-xs text-chili-600">{formError}</p>}
          <Button type="submit" loading={create.isPending || update.isPending} className="mt-2">
            {editing ? 'Save changes' : 'Create page'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
