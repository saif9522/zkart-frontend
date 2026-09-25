import { useEffect, useState } from 'react'
import { Pager } from '@/components/ui/Pager'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, ImagePlus, Package, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { apiErrorMessage } from '@/api/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import type { AdminOffer, OfferProductSummary } from '@/types'

/** Light, Zepto-like section backgrounds. */
const COLORS = ['#F3E8FF', '#FFF1D6', '#E3F7EC', '#FFE4E6', '#E0F2FE', '#FEF9C3', '#F1F5F9']

const emptyForm = { title: '', description: '', discount_label: '', link_url: '', bg_color: COLORS[0], display_order: '0' }

export function OffersPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AdminOffer | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [picked, setPicked] = useState<OfferProductSummary[]>([])
  const [formError, setFormError] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey: ['offers'], queryFn: adminApi.offers })
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['offers'] })

  // Save = offer details (multipart, may include image) → then its product list (JSON).
  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        description: form.description,
        discount_label: form.discount_label,
        link_url: form.link_url,
        bg_color: form.bg_color,
        display_order: Number(form.display_order) || 0,
        ...(imageFile ? { imageFile } : {}),
      } as Partial<AdminOffer> & { imageFile?: File }
      const offer = editing ? await adminApi.updateOffer(editing.id, payload) : await adminApi.createOffer(payload)
      return adminApi.setOfferProducts(offer.id, picked.map((p) => p.id))
    },
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
    setPicked([])
    setFormError('')
  }

  const startCreate = () => {
    closeModal()
    setOpen(true)
  }

  const startEdit = (o: AdminOffer) => {
    setEditing(o)
    setForm({
      title: o.title,
      description: o.description,
      discount_label: o.discount_label,
      link_url: o.link_url,
      bg_color: o.bg_color || COLORS[0],
      display_order: String(o.display_order ?? 0),
    })
    setPicked(o.products ?? [])
    setImageFile(null)
    setFormError('')
    setOpen(true)
  }

  const offers = data?.results ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-500">Offers</h1>
          <p className="text-xs text-ink-300">
            Add products to an offer and it shows as a coloured row right under the categories on the homepage.
          </p>
        </div>
        <Button size="sm" onClick={startCreate}>
          <Plus className="h-4 w-4" /> New offer
        </Button>
      </div>

      {isLoading && <p className="text-ink-300 animate-pulse">Loading...</p>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {offers.map((o) => (
          <div key={o.id} className="rounded-[var(--radius-card)] border border-ink-100/60 overflow-hidden" style={{ backgroundColor: o.bg_color || '#FFFFFF' }}>
            {o.image && (
              <img
                src={o.image}
                alt={o.title}
                className="h-24 w-full object-cover"
                onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
              />
            )}
            <div className="p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-ink-500 text-sm truncate">{o.title}</span>
                <button onClick={() => toggleActive.mutate({ id: o.id, is_active: !o.is_active })} title="Turn on/off">
                  <Badge status={o.is_active ? 'active' : 'inactive'} />
                </button>
              </div>
              {o.discount_label && <p className="text-xs text-chili-600 font-semibold mt-0.5">{o.discount_label}</p>}
              <p className="text-xs text-ink-400 mt-1 flex items-center gap-1">
                <Package className="h-3.5 w-3.5" />
                {o.products?.length
                  ? `${o.products.length} product${o.products.length > 1 ? 's' : ''} — shown as a homepage row`
                  : 'No products — shown as a small offer card'}
              </p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => startEdit(o)} className="text-ink-300 hover:text-forest-600" aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => window.confirm(`Delete offer "${o.title}"?`) && remove.mutate(o.id)}
                  className="text-ink-300 hover:text-chili-500"
                  aria-label="Delete"
                >
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
            setFormError('')
            save.mutate()
          }}
          className="flex flex-col gap-3"
        >
          <Field label="Title (e.g. Deals of the Day)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required autoFocus />
          <Field
            label="Badge (e.g. 'Up to 50% OFF', 'Buy 1 Get 1')"
            value={form.discount_label}
            onChange={(e) => setForm({ ...form, discount_label: e.target.value })}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-400">Short line under the title (optional)</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-forest-400 resize-none"
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-400">Section colour</span>
            <div className="flex gap-2 flex-wrap items-center">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setForm({ ...form, bg_color: c })}
                  className={`h-8 w-8 rounded-full border-2 ${form.bg_color.toUpperCase() === c ? 'border-forest-600' : 'border-ink-100'}`}
                  style={{ backgroundColor: c }}
                  aria-label={`Colour ${c}`}
                />
              ))}
              <input
                type="color"
                value={form.bg_color}
                onChange={(e) => setForm({ ...form, bg_color: e.target.value.toUpperCase() })}
                className="h-8 w-10 rounded cursor-pointer"
                aria-label="Custom colour"
              />
            </div>
          </div>

          <ProductPicker picked={picked} onChange={setPicked} />

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-400">Banner image (optional — shown above the products)</span>
            <label className="flex items-center gap-2 rounded-lg border border-dashed border-ink-100 px-3 py-2 text-sm text-ink-400 cursor-pointer hover:border-forest-400">
              <ImagePlus className="h-4 w-4" />
              {imageFile ? imageFile.name : 'Choose image'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
            </label>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Order on homepage (0 = first)"
              type="number"
              min={0}
              value={form.display_order}
              onChange={(e) => setForm({ ...form, display_order: e.target.value })}
            />
            <Field label="Link URL (cards only, optional)" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
          </div>
          {formError && <p className="text-xs text-chili-600">{formError}</p>}
          <Button type="submit" loading={save.isPending} className="mt-1">
            {editing ? 'Save changes' : 'Create offer'}
          </Button>
        </form>
      </Modal>
      <Pager endpoint="/admin/offers/" />
    </div>
  )
}

/** Search products and build the ordered list for an offer section. */
export function ProductPicker({ picked, onChange }: { picked: OfferProductSummary[]; onChange: (p: OfferProductSummary[]) => void }) {
  const [term, setTerm] = useState('')
  const [debounced, setDebounced] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 300)
    return () => clearTimeout(t)
  }, [term])

  const { data, isFetching } = useQuery({
    queryKey: ['offer-product-search', debounced],
    queryFn: () => adminApi.products({ search: debounced }),
    enabled: debounced.length >= 2,
  })
  const pickedIds = new Set(picked.map((p) => p.id))
  const results = (data?.results ?? []).filter((p) => !pickedIds.has(p.id)).slice(0, 8)

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= picked.length) return
    const next = [...picked]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-ink-400">
        Products in this offer ({picked.length}) — leave empty for a simple offer card
      </span>
      <div className="relative">
        <Search className="h-4 w-4 text-ink-300 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search products to add (type 2+ letters)…"
          className="w-full rounded-lg border border-ink-100 bg-rice-100 pl-8 pr-3 py-2 text-sm outline-none focus:bg-rice-50 focus:border-forest-400"
        />
      </div>
      {debounced.length >= 2 && (
        <div className="rounded-lg border border-ink-100 divide-y divide-ink-100/60 max-h-48 overflow-y-auto">
          {isFetching && <p className="text-xs text-ink-300 p-2 animate-pulse">Searching…</p>}
          {!isFetching && results.length === 0 && <p className="text-xs text-ink-300 p-2">No matching products.</p>}
          {results.map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() =>
                onChange([
                  ...picked,
                  { id: p.id, name: p.name, selling_price: p.selling_price, mrp: p.mrp, vendor_name: p.vendor_name, is_available: p.is_available },
                ])
              }
              className="w-full text-left px-2.5 py-2 hover:bg-forest-50 flex items-center justify-between gap-2"
            >
              <span className="min-w-0">
                <span className="block text-sm text-ink-500 truncate">{p.name}</span>
                <span className="block text-[11px] text-ink-300">
                  ₹{p.selling_price} · {p.vendor_name}
                  {!p.is_available && ' · hidden'}
                </span>
              </span>
              <Plus className="h-4 w-4 text-forest-600 shrink-0" />
            </button>
          ))}
        </div>
      )}
      {picked.length > 0 && (
        <ol className="rounded-lg border border-ink-100 divide-y divide-ink-100/60 max-h-56 overflow-y-auto">
          {picked.map((p, i) => (
            <li key={p.id} className="flex items-center gap-2 px-2.5 py-1.5">
              <span className="text-[11px] text-ink-300 w-4">{i + 1}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm text-ink-500 truncate">{p.name}</span>
                <span className="block text-[11px] text-ink-300">
                  ₹{p.selling_price}
                  {Number(p.mrp) > Number(p.selling_price) && <s className="ml-1">₹{p.mrp}</s>} · {p.vendor_name}
                  {p.is_available === false && <span className="text-chili-600"> · hidden from customers</span>}
                </span>
              </span>
              <button type="button" onClick={() => move(i, -1)} className="text-ink-300 hover:text-forest-600 disabled:opacity-30" disabled={i === 0} aria-label="Move up">
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => move(i, 1)} className="text-ink-300 hover:text-forest-600 disabled:opacity-30" disabled={i === picked.length - 1} aria-label="Move down">
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => onChange(picked.filter((x) => x.id !== p.id))} className="text-ink-300 hover:text-chili-500" aria-label="Remove">
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ol>
      )}
      <p className="text-[11px] text-ink-300">
        Tip: the price shown is the product's own price. To give a discount, lower the product's selling price (MRP stays
        crossed out) in Products.
      </p>
    </div>
  )
}
