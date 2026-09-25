import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Eye, EyeOff, LayoutTemplate, Pencil, Plus, Trash2 } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { apiErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { ProductPicker } from '@/pages/OffersPage'
import type { AdminHomeSection, HomeSectionKind, OfferProductSummary } from '@/types'

const KINDS: { value: HomeSectionKind; label: string; help: string; products: boolean }[] = [
  { value: 'featured', label: 'Trending', help: 'Products you marked “Featured” in Products.', products: true },
  { value: 'recommended', label: 'Recommended for you', help: 'Different for every customer — based on what they bought before.', products: true },
  { value: 'new_arrivals', label: 'New arrivals', help: 'Newest products — updates automatically.', products: true },
  { value: 'best_sellers', label: 'Best sellers', help: 'Most sold in the last 90 days (cancelled orders ignored) — automatic.', products: true },
  { value: 'top_deals', label: 'Top deals', help: 'Biggest % discount first — automatic.', products: true },
  { value: 'category', label: 'One category', help: 'Products from a category you choose (sub-categories included).', products: true },
  { value: 'manual', label: 'Hand-picked', help: 'You choose exactly which products, in which order.', products: true },
  { value: 'offers', label: 'Offers block', help: 'Shows your offer sections & offer cards (managed in Offers) at this spot.', products: false },
  { value: 'category_rows', label: 'Row per category', help: 'One product row for every category, at this spot.', products: false },
]
const kindInfo = (k: HomeSectionKind) => KINDS.find((x) => x.value === k)!

const COLORS = ['', '#F3E8FF', '#FFF1D6', '#E3F7EC', '#FFE4E6', '#E0F2FE', '#FEF9C3']

const emptyForm = {
  title: '',
  subtitle: '',
  kind: 'manual' as HomeSectionKind,
  category: '',
  product_limit: '12',
  bg_color: '',
  is_active: true,
}

export function HomeSectionsPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AdminHomeSection | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [picked, setPicked] = useState<OfferProductSummary[]>([])
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({ queryKey: ['home-sections'], queryFn: adminApi.homeSections })
  const { data: categoriesData } = useQuery({ queryKey: ['categories'], queryFn: adminApi.categories })
  const sections = data?.results ?? []
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['home-sections'] })

  const save = useMutation({
    mutationFn: async () => {
      const payload: Partial<AdminHomeSection> = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        kind: form.kind,
        category: form.kind === 'category' ? form.category || null : null,
        product_limit: Number(form.product_limit) || 12,
        bg_color: form.bg_color,
        is_active: form.is_active,
        ...(editing ? {} : { display_order: sections.length }),
      }
      const section = editing
        ? await adminApi.updateHomeSection(editing.id, payload)
        : await adminApi.createHomeSection(payload)
      if (form.kind === 'manual') await adminApi.setHomeSectionProducts(section.id, picked.map((p) => p.id))
      return section
    },
    onSuccess: () => {
      invalidate()
      close()
    },
    onError: (err) => setError(apiErrorMessage(err, 'Could not save the section.')),
  })

  const toggle = useMutation({
    mutationFn: (s: AdminHomeSection) => adminApi.updateHomeSection(s.id, { is_active: !s.is_active }),
    onSuccess: invalidate,
  })
  const remove = useMutation({ mutationFn: adminApi.deleteHomeSection, onSuccess: invalidate })
  const reorder = useMutation({ mutationFn: adminApi.reorderHomeSections, onSuccess: invalidate })

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= sections.length) return
    const ids = sections.map((s) => s.id)
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    // optimistic: show the new order immediately
    queryClient.setQueryData(['home-sections'], {
      ...data!,
      results: ids.map((id) => sections.find((s) => s.id === id)!),
    })
    reorder.mutate(ids)
  }

  const close = () => {
    setOpen(false)
    setEditing(null)
    setForm(emptyForm)
    setPicked([])
    setError('')
  }
  const startCreate = () => {
    close()
    setOpen(true)
  }
  const startEdit = (s: AdminHomeSection) => {
    setEditing(s)
    setForm({
      title: s.title,
      subtitle: s.subtitle,
      kind: s.kind,
      category: s.category ?? '',
      product_limit: String(s.product_limit),
      bg_color: s.bg_color || '',
      is_active: s.is_active,
    })
    setPicked(s.products ?? [])
    setError('')
    setOpen(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-ink-500 flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-forest-600" /> Homepage Sections
          </h1>
          <p className="text-xs text-ink-300 mt-0.5 max-w-xl">
            These rows appear on the customer homepage, top to bottom in this order — right after the banners and “Shop by
            Category”. Rename, re-order, switch off, or add your own (Trending, Best sellers, New arrivals, hand-picked…).
          </p>
        </div>
        <Button size="sm" onClick={startCreate}>
          <Plus className="h-4 w-4" /> New section
        </Button>
      </div>

      <div className="rounded-xl border border-dashed border-ink-100 bg-rice-50 px-3 py-2 text-xs text-ink-300">
        Always on top: Banners (Sliders) → Shop by Category → Stores near you
      </div>

      {isLoading && <p className="text-ink-300 animate-pulse">Loading...</p>}

      <ol className="flex flex-col gap-2">
        {sections.map((s, i) => {
          const info = kindInfo(s.kind)
          return (
            <li
              key={s.id}
              className={`rounded-xl border p-3 flex items-center gap-3 ${s.is_active ? 'border-ink-100/60 bg-rice-50' : 'border-ink-100/60 bg-rice-100 opacity-60'}`}
              style={s.bg_color && s.is_active ? { backgroundColor: s.bg_color } : undefined}
            >
              <div className="flex flex-col">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="text-ink-300 hover:text-forest-600 disabled:opacity-30" aria-label="Move up">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === sections.length - 1} className="text-ink-300 hover:text-forest-600 disabled:opacity-30" aria-label="Move down">
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
              <span className="text-xs font-mono text-ink-300 w-5 text-center">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink-500 truncate">{s.title}</p>
                <p className="text-xs text-ink-400 truncate">
                  <span className="font-semibold text-forest-700">{info.label}</span>
                  {s.kind === 'category' && s.category_name && ` · ${s.category_name}`}
                  {s.kind === 'manual' && ` · ${s.products.length} product${s.products.length === 1 ? '' : 's'}`}
                  {info.products && s.kind !== 'manual' && ` · up to ${s.product_limit}`}
                  {s.subtitle && ` · “${s.subtitle}”`}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => toggle.mutate(s)}
                  className={`flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-1 ${s.is_active ? 'bg-forest-100 text-forest-700' : 'bg-ink-100 text-ink-400'}`}
                  title={s.is_active ? 'Showing on homepage — click to hide' : 'Hidden — click to show'}
                >
                  {s.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{s.is_active ? 'Showing' : 'Hidden'}</span>
                </button>
                <button onClick={() => startEdit(s)} className="text-ink-300 hover:text-forest-600" aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => window.confirm(`Delete section "${s.title}"?`) && remove.mutate(s.id)}
                  className="text-ink-300 hover:text-chili-500"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          )
        })}
        {data && sections.length === 0 && (
          <p className="text-ink-300 text-center py-8">No sections yet — add one, e.g. “Trending near you”.</p>
        )}
      </ol>

      <Modal open={open} onClose={close} title={editing ? 'Edit section' : 'New homepage section'}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setError('')
            if (form.kind === 'category' && !form.category) return setError('Choose a category.')
            save.mutate()
          }}
          className="flex flex-col gap-3"
        >
          <Field label="Title (shown on homepage)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required autoFocus placeholder="e.g. Trending near you" />
          <Field label="Small line under the title (optional)" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="e.g. Most loved in Garhwa" />

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-400">What should this row show?</span>
            <select
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value as HomeSectionKind })}
              className="rounded-lg border border-ink-100 bg-rice-100 px-3 py-2 text-sm outline-none focus:border-forest-400"
            >
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-ink-300">{kindInfo(form.kind).help}</span>
          </label>

          {form.kind === 'category' && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-ink-400">Category</span>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="rounded-lg border border-ink-100 bg-rice-100 px-3 py-2 text-sm outline-none focus:border-forest-400"
              >
                <option value="">— Select category —</option>
                {categoriesData?.results.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {form.kind === 'manual' && <ProductPicker picked={picked} onChange={setPicked} />}

          {kindInfo(form.kind).products && form.kind !== 'manual' && (
            <Field
              label="How many products in the row (1–30)"
              type="number"
              min={1}
              max={30}
              value={form.product_limit}
              onChange={(e) => setForm({ ...form, product_limit: e.target.value })}
            />
          )}

          {kindInfo(form.kind).products && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-ink-400">Background (optional)</span>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    type="button"
                    key={c || 'none'}
                    onClick={() => setForm({ ...form, bg_color: c })}
                    className={`h-8 w-8 rounded-full border-2 text-[9px] text-ink-300 ${form.bg_color === c ? 'border-forest-600' : 'border-ink-100'}`}
                    style={{ backgroundColor: c || '#FFFFFF' }}
                    aria-label={c ? `Colour ${c}` : 'No colour'}
                  >
                    {c ? '' : 'none'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-ink-500">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="accent-forest-600" />
            Show on homepage
          </label>

          {error && <p className="text-xs text-chili-600">{error}</p>}
          <Button type="submit" loading={save.isPending}>
            {editing ? 'Save changes' : 'Add section'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
