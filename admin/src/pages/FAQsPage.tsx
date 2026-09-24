import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { apiErrorMessage } from '@/api/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import type { AdminFAQ } from '@/types'

const emptyForm = { question: '', answer: '' }

export function FAQsPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AdminFAQ | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey: ['admin-faqs'], queryFn: adminApi.faqs })
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-faqs'] })

  const create = useMutation({
    mutationFn: () => adminApi.createFAQ(form),
    onSuccess: () => {
      invalidate()
      closeModal()
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'Could not create the FAQ.')),
  })

  const update = useMutation({
    mutationFn: () => adminApi.updateFAQ(editing!.id, form),
    onSuccess: () => {
      invalidate()
      closeModal()
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'Could not save the FAQ.')),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => adminApi.updateFAQ(id, { is_active }),
    onSuccess: invalidate,
  })

  const remove = useMutation({ mutationFn: adminApi.deleteFAQ, onSuccess: invalidate })

  const closeModal = () => {
    setOpen(false)
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
  }

  const startEdit = (faq: AdminFAQ) => {
    setEditing(faq)
    setForm({ question: faq.question, answer: faq.answer })
    setFormError('')
    setOpen(true)
  }

  const faqs = data?.results ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-500">FAQs</h1>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New FAQ
        </Button>
      </div>

      {isLoading && <p className="text-ink-300 animate-pulse">Loading...</p>}

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 divide-y divide-ink-100/60">
        {faqs.map((faq) => (
          <div key={faq.id} className="p-3.5">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-ink-500 text-sm">{faq.question}</p>
              <button onClick={() => toggleActive.mutate({ id: faq.id, is_active: !faq.is_active })} className="shrink-0">
                <Badge status={faq.is_active ? 'active' : 'inactive'} />
              </button>
            </div>
            <p className="text-sm text-ink-400 mt-1">{faq.answer}</p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => startEdit(faq)} className="text-ink-300 hover:text-forest-600">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => remove.mutate(faq.id)} className="text-ink-300 hover:text-chili-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {data && faqs.length === 0 && <p className="text-ink-300 text-center py-8">No FAQs yet.</p>}
      </div>

      <Modal open={open} onClose={closeModal} title={editing ? 'Edit FAQ' : 'New FAQ'}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            editing ? update.mutate() : create.mutate()
          }}
          className="flex flex-col gap-3"
        >
          <Field label="Question" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required autoFocus />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-400">Answer</span>
            <textarea
              required
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              rows={3}
              className="rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-forest-400 resize-none"
            />
          </label>
          {formError && <p className="text-xs text-chili-600">{formError}</p>}
          <Button type="submit" loading={create.isPending || update.isPending} className="mt-2">
            {editing ? 'Save changes' : 'Create FAQ'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
