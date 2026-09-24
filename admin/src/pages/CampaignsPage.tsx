import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Camera, Copy, Eye, Globe, Mail, MessageCircle, MessageSquare, Pencil,
  Plus, Search, Send, Sparkles, Trash2, Users, X,
} from 'lucide-react'
import { adminApi } from '@/api/admin'
import { superAdminApi } from '@/api/superadmin'
import { apiErrorMessage } from '@/api/client'
import { CampaignDashboard } from '@/components/CampaignDashboard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import type { Campaign, CampaignAudience, SimpleCustomer } from '@/types'

const AUDIENCES: { value: CampaignAudience; label: string }[] = [
  { value: 'all_customers', label: 'All customers' },
  { value: 'recent_buyers', label: 'Ordered in the last 30 days' },
  { value: 'inactive', label: 'No order in 60+ days (win-back)' },
  { value: 'city', label: 'Customers in a specific city' },
  { value: 'selected', label: 'Hand-pick individual customers' },
]

const CHANNEL_META = [
  ['send_email', 'Email', Mail] as const,
  ['send_sms', 'SMS', MessageSquare] as const,
  ['send_whatsapp', 'WhatsApp', MessageCircle] as const,
  ['post_facebook', 'Facebook', Globe] as const,
  ['post_instagram', 'Instagram', Camera] as const,
]

const emptyForm = {
  name: '',
  send_email: true,
  send_sms: false,
  send_whatsapp: false,
  post_facebook: false,
  post_instagram: false,
  audience: 'all_customers' as CampaignAudience,
  audience_city: '',
  subject: '',
  message: '',
  link_url: '',
}

export function CampaignsPage() {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewing, setViewing] = useState<Campaign | null>(null)
  const [previewing, setPreviewing] = useState<Campaign | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [formError, setFormError] = useState('')
  const [selectedCustomers, setSelectedCustomers] = useState<SimpleCustomer[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [externalName, setExternalName] = useState('')
  const [externalEmail, setExternalEmail] = useState('')
  const [externalPhone, setExternalPhone] = useState('')
  const [aiTopic, setAiTopic] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey: ['campaigns'], queryFn: adminApi.campaigns })
  const { data: cities } = useQuery({ queryKey: ['cities'], queryFn: superAdminApi.cities })
  const { data: recipients } = useQuery({
    queryKey: ['campaign-recipients', viewing?.id],
    queryFn: () => adminApi.campaignRecipients(viewing!.id),
    enabled: !!viewing,
  })
  const { data: preview, isLoading: previewLoading } = useQuery({
    queryKey: ['campaign-preview', previewing?.id],
    queryFn: () => adminApi.campaignPreview(previewing!.id),
    enabled: !!previewing,
  })
  const { data: customerResults } = useQuery({
    queryKey: ['campaign-customer-search', customerSearch],
    queryFn: () => adminApi.searchCustomers(customerSearch),
    enabled: form.audience === 'selected' && customerSearch.length > 0,
  })
  const { data: externalContacts } = useQuery({
    queryKey: ['campaign-external-contacts', editingId],
    queryFn: () => adminApi.campaignExternalContacts(editingId!),
    enabled: !!editingId,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['campaigns'] })

  const create = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)))
      selectedCustomers.forEach((c) => fd.append('selected_customers', c.id))
      if (imageFile) fd.append('image', imageFile)
      return adminApi.createCampaign(fd)
    },
    onSuccess: (campaign) => {
      invalidate()
      setEditingId(campaign.id)
      setFormError('')
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'Could not save campaign.')),
  })

  const send = useMutation({
    mutationFn: adminApi.sendCampaign,
    onSuccess: invalidate,
    onError: (err) => alert(apiErrorMessage(err, 'Could not send campaign.')),
  })

  const remove = useMutation({ mutationFn: adminApi.deleteCampaign, onSuccess: invalidate })
  const duplicate = useMutation({ mutationFn: adminApi.duplicateCampaign, onSuccess: invalidate })

  const addExternal = useMutation({
    mutationFn: () =>
      adminApi.addExternalContact(editingId!, { name: externalName, email: externalEmail, phone: externalPhone }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-external-contacts', editingId] })
      setExternalName('')
      setExternalEmail('')
      setExternalPhone('')
    },
  })
  const removeExternal = useMutation({
    mutationFn: (contactId: string) => adminApi.removeExternalContact(editingId!, contactId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign-external-contacts', editingId] }),
  })

  const generateAI = useMutation({
    mutationFn: () => adminApi.generateAICampaignContent(aiTopic),
    onSuccess: (content) => {
      setForm((f) => ({ ...f, subject: content.email_subject, message: content.email_body }))
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'AI content generation unavailable — add ANTHROPIC_API_KEY in Settings.')),
  })

  const closeModal = () => {
    setOpen(false)
    setEditingId(null)
    setForm(emptyForm)
    setImageFile(null)
    setFormError('')
    setSelectedCustomers([])
    setCustomerSearch('')
    setAiTopic('')
  }

  const statusBadge = (status: Campaign['status']) => {
    const map: Record<Campaign['status'], 'active' | 'pending' | 'failed' | 'approved'> = {
      draft: 'pending', scheduled: 'pending', sending: 'pending',
      sent: 'active', partially_sent: 'approved', failed: 'failed',
    }
    return <Badge status={map[status]} label={status.replace('_', ' ')} />
  }

  const audienceSummary = (c: Campaign) => {
    if (c.audience === 'selected') return `${c.selected_customer_count} hand-picked`
    if (c.audience === 'city') return c.audience_city_name || 'City'
    return AUDIENCES.find((a) => a.value === c.audience)?.label ?? c.audience
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-500">Campaigns</h1>
          <p className="text-xs text-ink-300 mt-0.5">
            Email/SMS/WhatsApp reach your customers directly. Facebook &amp; Instagram post once to your store's own
            page (Instagram posts through your connected Facebook Page — that's how Meta links the two).
          </p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New campaign
        </Button>
      </div>

      <CampaignDashboard />

      <h2 className="text-sm font-semibold text-ink-500 -mb-1">All Campaigns</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {isLoading && <p className="text-ink-300 animate-pulse">Loading...</p>}
        {(data?.results ?? []).map((c) => (
          <div key={c.id} className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-500 truncate flex items-center gap-1.5">
                  {c.name}
                  {c.is_ai_generated && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-medium px-1.5 py-0.5 shrink-0">
                      <Sparkles className="h-2.5 w-2.5" /> AI
                    </span>
                  )}
                </p>
                <p className="text-xs text-ink-300 line-clamp-2 mt-0.5">{c.message}</p>
              </div>
              {statusBadge(c.status)}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {CHANNEL_META.filter(([key]) => c[key]).map(([key, label, Icon]) => (
                <span key={key} className="inline-flex items-center gap-1 rounded-full bg-forest-50 text-forest-700 text-[11px] font-medium px-2 py-0.5">
                  <Icon className="h-3 w-3" /> {label}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-ink-300">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {audienceSummary(c)}
              </span>
              <span>{c.sent_count}/{c.total_recipients || '—'} sent</span>
            </div>

            <div className="flex items-center gap-1.5 pt-2 border-t border-ink-100/60">
              <button onClick={() => setViewing(c)} title="View" className="p-1.5 text-ink-300 hover:text-forest-600">
                <Eye className="h-4 w-4" />
              </button>
              {c.status === 'draft' && (
                <button
                  onClick={() => {
                    setEditingId(c.id)
                    setForm({
                      name: c.name, send_email: c.send_email, send_sms: c.send_sms, send_whatsapp: c.send_whatsapp,
                      post_facebook: c.post_facebook, post_instagram: c.post_instagram, audience: c.audience,
                      audience_city: c.audience_city ?? '', subject: c.subject, message: c.message, link_url: c.link_url,
                    })
                    setOpen(true)
                  }}
                  title="Edit"
                  className="p-1.5 text-ink-300 hover:text-forest-600"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              <button onClick={() => setPreviewing(c)} title="Preview" className="p-1.5 text-ink-300 hover:text-forest-600">
                <Sparkles className="h-4 w-4" />
              </button>
              <button onClick={() => duplicate.mutate(c.id)} title="Duplicate" className="p-1.5 text-ink-300 hover:text-forest-600">
                <Copy className="h-4 w-4" />
              </button>
              {c.status === 'draft' && (
                <Button size="sm" onClick={() => send.mutate(c.id)} loading={send.isPending} className="ml-auto">
                  <Send className="h-3.5 w-3.5" /> Send
                </Button>
              )}
              <button onClick={() => remove.mutate(c.id)} title="Delete" className={c.status === 'draft' ? 'p-1.5 text-ink-300 hover:text-chili-500' : 'p-1.5 text-ink-300 hover:text-chili-500 ml-auto'}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {data && data.results.length === 0 && (
          <p className="text-ink-300 text-center py-12 col-span-full">No campaigns yet — create your first one.</p>
        )}
      </div>

      {/* Create / Edit modal */}
      <Modal open={open} onClose={closeModal} title={editingId ? 'Edit campaign' : 'New campaign'}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            create.mutate()
          }}
          className="flex flex-col gap-3"
        >
          <Field label="Campaign name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />

          <div>
            <span className="text-xs font-semibold text-ink-400 block mb-1.5">Channels</span>
            <div className="grid grid-cols-2 gap-2">
              {CHANNEL_META.map(([key, label, Icon]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-ink-500 rounded-lg border border-ink-100 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                    className="accent-forest-600"
                  />
                  <Icon className="h-4 w-4 text-ink-300" /> {label}
                </label>
              ))}
            </div>
            {form.post_instagram && !form.post_facebook && (
              <p className="text-xs text-mango-700 mt-1.5">
                Instagram posts through your connected Facebook Page (that's how Meta links the two) — make sure a
                Page is connected in Settings even if you don't check Facebook here.
              </p>
            )}
          </div>

          {(form.send_email || form.send_sms || form.send_whatsapp) && (
            <div className="flex flex-col gap-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink-400">Audience</span>
                <div className="flex gap-2">
                  <select
                    value={form.audience}
                    onChange={(e) => setForm({ ...form, audience: e.target.value as CampaignAudience })}
                    className="flex-1 rounded-lg border border-ink-100 bg-rice-100 px-3 py-2 text-sm outline-none focus:border-forest-400"
                  >
                    {AUDIENCES.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                  {form.audience === 'city' && (
                    <select
                      value={form.audience_city}
                      onChange={(e) => setForm({ ...form, audience_city: e.target.value })}
                      className="flex-1 rounded-lg border border-ink-100 bg-rice-100 px-3 py-2 text-sm outline-none focus:border-forest-400"
                    >
                      <option value="">Select city</option>
                      {(cities?.results ?? []).map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </label>

              {form.audience === 'selected' && (
                <div className="rounded-lg border border-ink-100 p-2.5">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-300" />
                    <input
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="Search customers by name, phone, or email"
                      className="w-full rounded-lg border border-ink-100 bg-rice-100 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-forest-400"
                    />
                  </div>
                  {(customerResults ?? []).length > 0 && (
                    <div className="mt-1.5 max-h-32 overflow-y-auto flex flex-col gap-1">
                      {(customerResults ?? []).map((cust) => (
                        <button
                          key={cust.id}
                          type="button"
                          onClick={() => {
                            if (!selectedCustomers.some((s) => s.id === cust.id)) setSelectedCustomers([...selectedCustomers, cust])
                            setCustomerSearch('')
                          }}
                          className="text-left text-xs px-2 py-1.5 rounded hover:bg-rice-100 text-ink-500"
                        >
                          {cust.full_name || cust.phone} <span className="text-ink-300">· {cust.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedCustomers.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedCustomers.map((cust) => (
                        <span key={cust.id} className="inline-flex items-center gap-1 rounded-full bg-forest-50 text-forest-700 text-[11px] px-2 py-1">
                          {cust.full_name || cust.phone}
                          <button type="button" onClick={() => setSelectedCustomers(selectedCustomers.filter((s) => s.id !== cust.id))}>
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-ink-300 mt-1.5">{selectedCustomers.length} selected</p>
                </div>
              )}
            </div>
          )}

          {editingId && (
            <div className="rounded-lg border border-ink-100 p-2.5">
              <span className="text-xs font-semibold text-ink-400 block mb-1.5">
                External contacts (not in your customer list — press, partners, etc.)
              </span>
              <div className="flex flex-col gap-1.5 mb-2">
                {(externalContacts ?? []).map((ec) => (
                  <div key={ec.id} className="flex items-center justify-between text-xs bg-rice-100 rounded px-2 py-1.5">
                    <span className="text-ink-500">{ec.name || ec.email || ec.phone} <span className="text-ink-300">{ec.email} {ec.phone}</span></span>
                    <button type="button" onClick={() => removeExternal.mutate(ec.id)} className="text-ink-300 hover:text-chili-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <input value={externalName} onChange={(e) => setExternalName(e.target.value)} placeholder="Name" className="rounded-lg border border-ink-100 px-2 py-1.5 text-xs outline-none focus:border-forest-400" />
                <input value={externalEmail} onChange={(e) => setExternalEmail(e.target.value)} placeholder="Email" className="rounded-lg border border-ink-100 px-2 py-1.5 text-xs outline-none focus:border-forest-400" />
                <input value={externalPhone} onChange={(e) => setExternalPhone(e.target.value)} placeholder="Phone" className="rounded-lg border border-ink-100 px-2 py-1.5 text-xs outline-none focus:border-forest-400" />
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => addExternal.mutate()}
                loading={addExternal.isPending}
                disabled={!externalEmail && !externalPhone}
                className="mt-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Add contact
              </Button>
            </div>
          )}

          {form.send_email && (
            <Field label="Email subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          )}

          <div className="flex items-center gap-2">
            <input
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="e.g. 'Diwali sale' — describe the campaign for AI"
              className="flex-1 rounded-lg border border-ink-100 bg-rice-100 px-3 py-2 text-xs outline-none focus:border-forest-400"
            />
            <Button type="button" size="sm" variant="ghost" onClick={() => generateAI.mutate()} loading={generateAI.isPending} disabled={!aiTopic}>
              <Sparkles className="h-3.5 w-3.5" /> AI draft
            </Button>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-400">Message</span>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={4}
              required
              placeholder="What do you want to tell people? (used for email body, SMS, WhatsApp, and as the social caption)"
              className="rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-forest-400 resize-none"
            />
          </label>

          <Field label="Link (optional)" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://..." />

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-400">
              Image {form.post_instagram && <span className="text-chili-600">(required for Instagram)</span>}
            </span>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} className="text-sm" />
          </label>

          {formError && <p className="text-xs text-chili-600">{formError}</p>}

          <Button type="submit" loading={create.isPending} className="mt-2">
            {editingId ? 'Save changes' : 'Save as draft'}
          </Button>
          {editingId && <p className="text-xs text-ink-300 text-center">Add external contacts, then Preview and Send from the campaign card.</p>}
        </form>
      </Modal>

      {/* View modal */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.name ?? ''}>
        {viewing && (
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              {statusBadge(viewing.status)}
              <div className="flex items-center gap-1.5">
                {CHANNEL_META.filter(([key]) => viewing[key]).map(([key, , Icon]) => (
                  <Icon key={key} className="h-4 w-4 text-ink-300" />
                ))}
              </div>
            </div>
            <p className="text-ink-500 whitespace-pre-wrap">{viewing.message}</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-rice-100 p-2">
                <p className="text-xs text-ink-300">Recipients</p>
                <p className="font-semibold text-ink-500">{viewing.total_recipients}</p>
              </div>
              <div className="rounded-lg bg-rice-100 p-2">
                <p className="text-xs text-ink-300">Sent</p>
                <p className="font-semibold text-forest-600">{viewing.sent_count}</p>
              </div>
              <div className="rounded-lg bg-rice-100 p-2">
                <p className="text-xs text-ink-300">Failed</p>
                <p className="font-semibold text-chili-600">{viewing.failed_count}</p>
              </div>
            </div>
            {viewing.facebook_error && <p className="text-xs text-chili-600">Facebook: {viewing.facebook_error}</p>}
            {viewing.instagram_error && <p className="text-xs text-chili-600">Instagram: {viewing.instagram_error}</p>}
            {recipients && recipients.results.length > 0 && (
              <div className="max-h-56 overflow-y-auto flex flex-col gap-1 border-t border-ink-100 pt-2">
                {recipients.results.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-xs">
                    <span className="text-ink-400">{r.user_name || r.user_phone} · {r.channel}</span>
                    <Badge status={r.status === 'sent' ? 'active' : r.status === 'failed' ? 'failed' : 'pending'} label={r.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Preview modal — exactly what each channel will show */}
      <Modal open={!!previewing} onClose={() => setPreviewing(null)} title={`Preview — ${previewing?.name ?? ''}`}>
        {previewLoading && <p className="text-ink-300 animate-pulse">Loading preview...</p>}
        {preview && (
          <div className="flex flex-col gap-4">
            {preview.email && (
              <div className="rounded-xl border border-ink-100 overflow-hidden">
                <div className="bg-ink-500 text-rice-50 text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-ink-500">{preview.email.subject}</p>
                  {preview.email.image && <img src={preview.email.image} alt="" className="rounded-lg my-2 max-h-40 object-cover" />}
                  <p className="text-xs text-ink-400 whitespace-pre-wrap mt-1">{preview.email.body}</p>
                </div>
              </div>
            )}
            {preview.whatsapp && (
              <div className="rounded-xl border border-ink-100 overflow-hidden">
                <div className="bg-forest-600 text-rice-50 text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</div>
                <div className="p-3 bg-[#ece5dd]">
                  <div className="bg-white rounded-lg rounded-tl-none p-2.5 max-w-[85%] shadow-sm">
                    {preview.whatsapp.image && <img src={preview.whatsapp.image} alt="" className="rounded mb-1.5 max-h-32 object-cover" />}
                    <p className="text-xs text-ink-500 whitespace-pre-wrap">{preview.whatsapp.body}</p>
                  </div>
                </div>
              </div>
            )}
            {preview.sms && (
              <div className="rounded-xl border border-ink-100 overflow-hidden">
                <div className="bg-ink-400 text-rice-50 text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> SMS</div>
                <div className="p-3"><p className="text-xs text-ink-500">{preview.sms.body}</p></div>
              </div>
            )}
            {preview.facebook && (
              <div className="rounded-xl border border-ink-100 overflow-hidden">
                <div className="bg-blue-700 text-rice-50 text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Facebook</div>
                <div className="p-3">
                  {preview.facebook.image && <img src={preview.facebook.image} alt="" className="rounded-lg mb-2 max-h-40 object-cover w-full" />}
                  <p className="text-xs text-ink-500 whitespace-pre-wrap">{preview.facebook.caption}</p>
                </div>
              </div>
            )}
            {preview.instagram && (
              <div className="rounded-xl border border-ink-100 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-rice-50 text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5"><Camera className="h-3.5 w-3.5" /> Instagram</div>
                <div className="p-3">
                  {preview.instagram.image && <img src={preview.instagram.image} alt="" className="rounded-lg mb-2 max-h-40 object-cover w-full" />}
                  <p className="text-xs text-ink-500 whitespace-pre-wrap">{preview.instagram.caption}</p>
                </div>
              </div>
            )}
            {Object.keys(preview).length === 0 && <p className="text-ink-300 text-center py-8">No channels selected.</p>}
          </div>
        )}
      </Modal>
    </div>
  )
}
