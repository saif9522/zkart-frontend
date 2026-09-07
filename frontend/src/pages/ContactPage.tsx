import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Mail } from 'lucide-react'
import { cmsApi } from '@/api/cms'
import { apiErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/Button'

const emptyForm = { name: '', email: '', phone: '', subject: '', message: '' }

export function ContactPage() {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const submit = useMutation({
    mutationFn: () => cmsApi.submitContact(form),
    onSuccess: () => setForm(emptyForm),
    onError: (err) => setError(apiErrorMessage(err, 'Could not send your message. Please try again.')),
  })

  if (submit.isSuccess) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <Mail className="h-12 w-12 text-forest-600 mx-auto" />
        <p className="text-ink-500 font-medium mt-4">Thanks for reaching out!</p>
        <p className="text-sm text-ink-300 mt-1">We'll get back to you soon.</p>
        <Button variant="ghost" className="mt-4" onClick={() => submit.reset()}>
          Send another message
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="font-display text-xl font-semibold text-ink-500 mb-1">Contact us</h1>
      <p className="text-sm text-ink-300 mb-4">Questions, feedback, or an issue with an order — we're here to help.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          setError('')
          submit.mutate()
        }}
        className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4 flex flex-col gap-3"
      >
        <input
          required
          placeholder="Your name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-xl border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-forest-400"
        />
        <input
          required
          type="email"
          placeholder="Email address"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="rounded-xl border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-forest-400"
        />
        <input
          placeholder="Phone (optional)"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="rounded-xl border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-forest-400"
        />
        <input
          required
          placeholder="Subject"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="rounded-xl border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-forest-400"
        />
        <textarea
          required
          placeholder="Your message"
          rows={4}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="rounded-xl border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-forest-400 resize-none"
        />
        {error && <p className="text-xs text-chili-600">{error}</p>}
        <Button type="submit" loading={submit.isPending}>
          Send message
        </Button>
      </form>
    </div>
  )
}
