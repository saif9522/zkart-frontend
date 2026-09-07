import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Layers, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { ProductVariantsModal } from '@/components/ProductVariantsModal'
import { adminApi } from '@/api/admin'
import { apiErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import type { Product } from '@/types'

const emptyForm = {
  vendor: '',
  category: '',
  name: '',
  description: '',
  unit: '',
  mrp: '',
  selling_price: '',
  sku: '',
  stock_quantity: '0',
  is_available: true,
  is_featured: false,
}

export function ProductsPage() {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [managingProduct, setManagingProduct] = useState<Product | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => adminApi.products(search ? { search } : {}),
  })
  const { data: vendorsData } = useQuery({ queryKey: ['vendors', 'all'], queryFn: () => adminApi.vendors() })
  const { data: categoriesData } = useQuery({ queryKey: ['categories'], queryFn: adminApi.categories })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['products'] })

  const create = useMutation({
    mutationFn: () =>
      adminApi.createProduct({
        ...form,
        stock_quantity: Number(form.stock_quantity) as unknown as number,
      }),
    onSuccess: (product) => {
      invalidate()
      setEditing(product)
      setFormError('')
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'Could not save the product.')),
  })

  const update = useMutation({
    mutationFn: () =>
      adminApi.updateProduct(editing!.id, {
        ...form,
        stock_quantity: Number(form.stock_quantity) as unknown as number,
      }),
    onSuccess: () => {
      invalidate()
      closeModal()
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'Could not save the product.')),
  })

  const remove = useMutation({ mutationFn: adminApi.deleteProduct, onSuccess: invalidate })

  const [importResult, setImportResult] = useState<{ created: number; errors: string[] } | null>(null)
  const importCsv = useMutation({
    mutationFn: (file: File) => adminApi.importProductsCsv(file),
    onSuccess: (result) => {
      invalidate()
      setImportResult(result)
    },
    onError: (err) => setImportResult({ created: 0, errors: [apiErrorMessage(err, 'Import failed.')] }),
  })

  const handleExport = async () => {
    const blob = await adminApi.exportProductsCsv()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'products.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) importCsv.mutate(file)
    e.target.value = ''
  }

  const uploadImage = useMutation({
    mutationFn: ({ file, isPrimary }: { file: File; isPrimary: boolean }) =>
      adminApi.uploadProductImage(editing!.id, file, isPrimary),
    onSuccess: async () => {
      invalidate()
      if (editing) setEditing(await adminApi.getProduct(editing.id))
    },
  })

  const deleteImage = useMutation({
    mutationFn: (imageId: string) => adminApi.deleteProductImage(editing!.id, imageId),
    onSuccess: async () => {
      invalidate()
      if (editing) setEditing(await adminApi.getProduct(editing.id))
    },
  })

  const openCreate = () => {
    setForm(emptyForm)
    setEditing(null)
    setFormError('')
    setOpen(true)
  }

  const openEdit = (p: Product) => {
    setForm({
      vendor: p.vendor,
      category: p.category,
      name: p.name,
      description: p.description,
      unit: p.unit,
      mrp: p.mrp,
      selling_price: p.selling_price,
      sku: p.sku,
      stock_quantity: String(p.stock_quantity),
      is_available: p.is_available,
      is_featured: p.is_featured,
    })
    setEditing(p)
    setFormError('')
    setOpen(true)
  }

  const closeModal = () => {
    setOpen(false)
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!form.vendor || !form.category) {
      setFormError('Vendor aur category dono select karein.')
      return
    }
    if (editing) update.mutate()
    else create.mutate()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length && editing) {
      for (let i = 0; i < files.length; i++) {
        // eslint-disable-next-line no-await-in-loop -- images must upload one at a time; the API takes one file per request
        await uploadImage.mutateAsync({ file: files[i], isPrimary: editing.images.length === 0 && i === 0 })
      }
    }
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-ink-500">Products</h1>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="rounded-lg border border-ink-100 bg-rice-50 px-3 py-2 text-sm outline-none focus:border-forest-400 w-56"
          />
          <Button size="sm" variant="outline" onClick={handleExport}>
            Export CSV
          </Button>
          <label className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-ink-100 text-ink-500 hover:bg-rice-100 cursor-pointer">
            {importCsv.isPending ? 'Importing...' : 'Import CSV'}
            <input type="file" accept=".csv" onChange={handleImportFile} className="hidden" disabled={importCsv.isPending} />
          </label>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New product
          </Button>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs text-ink-300">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Vendor</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-300">
                  Loading...
                </td>
              </tr>
            )}
            {data?.results.map((p) => (
              <tr key={p.id} className="border-b border-ink-100/60 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {p.images[0] ? (
                      <img src={p.images[0].image} alt={p.name} className="h-9 w-9 rounded-lg object-cover border border-ink-100" />
                    ) : (
                      <div className="h-9 w-9 rounded-lg bg-rice-100 border border-ink-100" />
                    )}
                    <div>
                      <div className="font-medium text-ink-500">{p.name}</div>
                      <div className="text-xs text-ink-300">{p.unit}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-400">{p.vendor_name}</td>
                <td className="px-4 py-3 text-ink-400">{p.category_name}</td>
                <td className="px-4 py-3 font-mono text-ink-500">
                  ₹{p.selling_price}
                  {Number(p.mrp) > Number(p.selling_price) && (
                    <span className="ml-1.5 text-xs text-ink-300 line-through">₹{p.mrp}</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-ink-400">{p.stock_quantity}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      p.is_available ? 'bg-forest-100 text-forest-700' : 'bg-chili-100 text-chili-600'
                    }`}
                  >
                    {p.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)} className="text-ink-300 hover:text-forest-600">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setManagingProduct(p)} className="text-ink-300 hover:text-forest-600" title="Manage attributes & variants">
                      <Layers className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove.mutate(p.id)} className="text-ink-300 hover:text-chili-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {data && data.results.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-300">
                  Koi product nahi mila.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={closeModal} title={editing ? 'Edit product' : 'New product'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-400">Vendor / Shop</span>
            <select
              value={form.vendor}
              onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
              className="rounded-lg border border-ink-100 bg-rice-100 px-3 py-2 text-sm outline-none focus:border-forest-400"
              required
            >
              <option value="">— Select vendor —</option>
              {vendorsData?.results.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.shop_name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-400">Category</span>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="rounded-lg border border-ink-100 bg-rice-100 px-3 py-2 text-sm outline-none focus:border-forest-400"
              required
            >
              <option value="">— Select category —</option>
              {categoriesData?.results.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <Field
            label="Product name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-400">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="rounded-lg border border-ink-100 bg-rice-100 px-3 py-2 text-sm outline-none focus:bg-rice-50 focus:border-forest-400"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Unit (e.g. 500 g, 1 pc)"
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              required
            />
            <Field
              label="SKU (optional)"
              value={form.sku}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
            />
            <Field
              label="MRP (₹)"
              type="number"
              step="0.01"
              value={form.mrp}
              onChange={(e) => setForm((f) => ({ ...f, mrp: e.target.value }))}
              required
            />
            <Field
              label="Selling price (₹)"
              type="number"
              step="0.01"
              value={form.selling_price}
              onChange={(e) => setForm((f) => ({ ...f, selling_price: e.target.value }))}
              required
            />
            <Field
              label="Stock quantity"
              type="number"
              value={form.stock_quantity}
              onChange={(e) => setForm((f) => ({ ...f, stock_quantity: e.target.value }))}
              required
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-ink-400">
              <input
                type="checkbox"
                checked={form.is_available}
                onChange={(e) => setForm((f) => ({ ...f, is_available: e.target.checked }))}
              />
              Available
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-400">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
              />
              Featured
            </label>
          </div>

          {formError && <p className="text-xs text-chili-600">{formError}</p>}

          <Button type="submit" loading={create.isPending || update.isPending} className="mt-1">
            {editing ? 'Save changes' : 'Create product'}
          </Button>

          {editing && (
            <div className="mt-2 border-t border-ink-100 pt-3">
              <p className="text-xs font-semibold text-ink-400 mb-2">Images</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {editing.images.map((img) => (
                  <div key={img.id} className="relative">
                    <img src={img.image} alt="" className="h-16 w-16 rounded-lg object-cover border border-ink-100" />
                    {img.is_primary && (
                      <span className="absolute -top-1.5 -left-1.5 bg-mango-500 rounded-full p-0.5">
                        <Star className="h-3 w-3 text-forest-900 fill-current" />
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteImage.mutate(img.id)}
                      className="absolute -top-1.5 -right-1.5 bg-chili-500 rounded-full p-0.5"
                    >
                      <Trash2 className="h-3 w-3 text-rice-50" />
                    </button>
                  </div>
                ))}
                <label className="h-16 w-16 rounded-lg border border-dashed border-ink-100 flex items-center justify-center text-ink-300 hover:text-forest-600 hover:border-forest-400 cursor-pointer">
                  <ImagePlus className="h-5 w-5" />
                  <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                </label>
              </div>
              {uploadImage.isPending && <p className="text-xs text-ink-300">Uploading...</p>}
            </div>
          )}
        </form>
      </Modal>

      <Modal open={!!importResult} onClose={() => setImportResult(null)} title="CSV import result">
        {importResult && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-forest-700 font-semibold">{importResult.created} product(s) created.</p>
            {importResult.errors.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-lg bg-chili-50 border border-chili-100 p-2.5">
                {importResult.errors.map((err, i) => (
                  <p key={i} className="text-xs text-chili-600">
                    {err}
                  </p>
                ))}
              </div>
            )}
            <Button size="sm" variant="outline" onClick={() => setImportResult(null)} className="mt-1">
              Close
            </Button>
          </div>
        )}
      </Modal>

      {managingProduct && (
        <ProductVariantsModal
          productId={managingProduct.id}
          productName={managingProduct.name}
          onClose={() => setManagingProduct(null)}
        />
      )}
    </div>
  )
}
