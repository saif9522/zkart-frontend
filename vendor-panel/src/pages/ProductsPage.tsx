import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Layers, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { ProductVariantsModal } from '@/components/ProductVariantsModal'
import { vendorApi } from '@/api/vendor'
import { apiErrorMessage } from '@/api/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import type { ProductDetail, ProductWritePayload } from '@/types'

const emptyForm: ProductWritePayload = {
  category: '',
  name: '',
  description: '',
  unit: '',
  mrp: '',
  selling_price: '',
  sku: '',
  stock_quantity: 0,
  is_available: true,
  manufacturer_or_marketer: '',
  country_of_origin: 'India',
  shelf_life: '',
}

export function ProductsPage() {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [form, setForm] = useState<ProductWritePayload>(emptyForm)
  const [formError, setFormError] = useState('')
  const [managing, setManaging] = useState<{ slug: string; name: string } | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-products', search],
    queryFn: () => vendorApi.myProducts(search || undefined),
  })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: vendorApi.categories })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['vendor-products'] })

  const create = useMutation({
    mutationFn: () => vendorApi.createProduct(form),
    onSuccess: () => {
      invalidate()
      closeModal()
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'Could not create the product.')),
  })

  const update = useMutation({
    mutationFn: () => vendorApi.updateProduct(editingSlug!, form),
    onSuccess: () => {
      invalidate()
      closeModal()
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'Could not save changes.')),
  })

  const toggleAvailable = useMutation({
    mutationFn: ({ slug, is_available }: { slug: string; is_available: boolean }) =>
      vendorApi.updateProduct(slug, { is_available }),
    onSuccess: invalidate,
  })

  const remove = useMutation({ mutationFn: vendorApi.deleteProduct, onSuccess: invalidate })

  const closeModal = () => {
    setOpen(false)
    setEditingSlug(null)
    setForm(emptyForm)
    setFormError('')
  }

  const startCreate = () => {
    setEditingSlug(null)
    setForm(emptyForm)
    setFormError('')
    setOpen(true)
  }

  const startEdit = async (slug: string) => {
    const detail: ProductDetail = await vendorApi.productDetail(slug)
    setEditingSlug(slug)
    setForm({
      category: '', // category id isn't in ProductDetail (only category_name) — left blank, vendor can re-pick if needed
      name: detail.name,
      description: detail.description,
      unit: detail.unit,
      mrp: detail.mrp,
      selling_price: detail.selling_price,
      sku: detail.sku,
      stock_quantity: detail.stock_quantity,
      is_available: detail.is_available,
      manufacturer_or_marketer: detail.manufacturer_or_marketer,
      country_of_origin: detail.country_of_origin || 'India',
      shelf_life: detail.shelf_life,
    })
    setFormError('')
    setOpen(true)
  }

  const products = data?.results ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-500">Your Products</h1>
        <Button size="sm" onClick={startCreate}>
          <Plus className="h-4 w-4" /> New product
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your products"
          className="w-full rounded-lg border border-ink-100 bg-rice-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-forest-400"
        />
      </div>

      {isLoading && <p className="text-ink-300 animate-pulse">Loading...</p>}

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 divide-y divide-ink-100/60">
        {products.map((p) => (
          <div key={p.id} className="flex items-center gap-3 p-3">
            {p.primary_image ? (
              <img src={p.primary_image} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-rice-100 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-ink-500 text-sm truncate">{p.name}</p>
              <p className="text-xs text-ink-300">
                {p.category_name} · ₹{p.selling_price} / {p.unit}
              </p>
            </div>
            <button onClick={() => toggleAvailable.mutate({ slug: p.slug, is_available: !p.in_stock })}>
              <Badge status={p.in_stock ? 'active' : 'inactive'} label={p.in_stock ? 'Available' : 'Unavailable'} />
            </button>
            <button onClick={() => setManaging({ slug: p.slug, name: p.name })} className="text-ink-300 hover:text-forest-600" title="Images, attributes, variants">
              <Layers className="h-4 w-4" />
            </button>
            <button onClick={() => startEdit(p.slug)} className="text-ink-300 hover:text-forest-600">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => remove.mutate(p.slug)} className="text-ink-300 hover:text-chili-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {data && products.length === 0 && <p className="text-ink-300 text-center py-8">No products yet — add your first one.</p>}
      </div>

      <Modal open={open} onClose={closeModal} title={editingSlug ? 'Edit product' : 'New product'}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            editingSlug ? update.mutate() : create.mutate()
          }}
          className="flex flex-col gap-3"
        >
          <Field label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
          {!editingSlug && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-ink-400">Category</span>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
                className="rounded-lg border border-ink-100 bg-rice-100 px-3 py-2 text-sm outline-none focus:border-forest-400"
              >
                <option value="">Select a category</option>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <Field label="Unit (e.g. 500 g, 1 L)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="MRP" type="number" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} required />
            <Field
              label="Selling price"
              type="number"
              value={form.selling_price}
              onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
              required
            />
          </div>
          <Field
            label="Stock quantity"
            type="number"
            value={form.stock_quantity}
            onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) })}
          />
          <Field label="SKU (optional)" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          <Field
            label="Manufacturer / Marketer (optional)"
            value={form.manufacturer_or_marketer}
            onChange={(e) => setForm({ ...form, manufacturer_or_marketer: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Country of origin"
              value={form.country_of_origin}
              onChange={(e) => setForm({ ...form, country_of_origin: e.target.value })}
            />
            <Field
              label="Shelf life (optional)"
              value={form.shelf_life}
              onChange={(e) => setForm({ ...form, shelf_life: e.target.value })}
              placeholder="e.g. 24 months"
            />
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-400">Description (optional)</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-forest-400 resize-none"
            />
          </label>
          {formError && <p className="text-xs text-chili-600">{formError}</p>}
          <Button type="submit" loading={create.isPending || update.isPending} className="mt-2">
            {editingSlug ? 'Save changes' : 'Create product'}
          </Button>
          {editingSlug && (
            <p className="text-xs text-ink-300 text-center">
              To add photos, specs, or size/pack options, save first then use the layers icon on the product row.
            </p>
          )}
        </form>
      </Modal>

      {managing && (
        <ProductVariantsModal productSlug={managing.slug} productName={managing.name} onClose={() => setManaging(null)} />
      )}
    </div>
  )
}
