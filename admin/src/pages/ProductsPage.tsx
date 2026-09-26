import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, ImagePlus, Layers, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { AdminImage } from '@/components/ui/AdminImage'
import { MatchPhotosModal } from '@/components/MatchPhotosModal'
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
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filters, setFilters] = useState<Filters>({})
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [bulkCategory, setBulkCategory] = useState('')
  const [bulkMsg, setBulkMsg] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [matchOpen, setMatchOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => clearTimeout(t)
  }, [search])
  // Any filter/search/page-size change → back to page 1, clear selection.
  useEffect(() => {
    setPage(1)
    setSelected(new Set())
  }, [debouncedSearch, filters, pageSize])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [managingProduct, setManagingProduct] = useState<Product | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', debouncedSearch, filters, page, pageSize],
    queryFn: () =>
      adminApi.products({ ...(debouncedSearch ? { search: debouncedSearch } : {}), ...filters, page, page_size: pageSize }),
    placeholderData: (prev) => prev,
  })
  const { data: stats } = useQuery({ queryKey: ['products', 'stats'], queryFn: adminApi.productStats })
  const totalPages = data ? Math.max(1, Math.ceil(data.count / pageSize)) : 1
  const rows = data?.results ?? []
  const allOnPageSelected = rows.length > 0 && rows.every((p) => selected.has(p.id))

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const togglePage = () =>
    setSelected((prev) => {
      const next = new Set(prev)
      rows.forEach((p) => (allOnPageSelected ? next.delete(p.id) : next.add(p.id)))
      return next
    })

  const bulk = useMutation({
    mutationFn: ({ action, category }: { action: Parameters<typeof adminApi.bulkProducts>[1]; category?: string }) =>
      adminApi.bulkProducts([...selected], action, category),
    onSuccess: (res) => {
      setBulkMsg(`Done — ${res.updated} product(s) updated.`)
      setSelected(new Set())
      setBulkCategory('')
      invalidate()
    },
    onError: (err) => setBulkMsg(apiErrorMessage(err, 'Bulk update failed.')),
  })
  const { data: vendorsData } = useQuery({ queryKey: ['vendors', 'all'], queryFn: () => adminApi.vendors({ page_size: 1000 }) })
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
  const confirmRemove = (p: Product) => window.confirm(`Delete "${p.name}"? This can't be undone.`) && remove.mutate(p.id)

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
    onMutate: () => setUploadError(''),
    onError: (err) => setUploadError(apiErrorMessage(err, 'Photo upload failed. Please try again.')),
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
        try {
          // eslint-disable-next-line no-await-in-loop -- one file per request
          await uploadImage.mutateAsync({ file: files[i], isPrimary: editing.images.length === 0 && i === 0 })
        } catch {
          break // error message is shown under the photos
        }
      }
    }
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-ink-500">Products</h1>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, SKU, barcode…"
            className="rounded-lg border border-ink-100 bg-rice-50 px-3 py-2 text-sm outline-none focus:border-forest-400 flex-1 sm:flex-none sm:w-56 min-w-0"
          />
          <Button size="sm" variant="outline" onClick={handleExport}>
            Export CSV
          </Button>
          <label className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-ink-100 text-ink-500 hover:bg-rice-100 cursor-pointer">
            {importCsv.isPending ? 'Importing...' : 'Import CSV'}
            <input type="file" accept=".csv" onChange={handleImportFile} className="hidden" disabled={importCsv.isPending} />
          </label>
          <Button size="sm" variant="outline" onClick={() => setMatchOpen(true)}>
            Match photos
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New product
          </Button>
        </div>
      </div>
      <MatchPhotosModal open={matchOpen} onClose={() => setMatchOpen(false)} />

      {/* Stat cards — tap one to filter the list */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {STAT_CARDS.map((c) => {
          const active = JSON.stringify(c.filter) === JSON.stringify(filters)
          return (
            <button
              key={c.key}
              onClick={() => setFilters(active ? {} : c.filter)}
              className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                active ? 'border-forest-600 bg-forest-50' : 'border-ink-100/60 bg-rice-50 hover:border-forest-400'
              }`}
            >
              <p className="text-[11px] text-ink-300 leading-tight">{c.label}</p>
              <p className={`font-mono text-lg font-bold ${c.tone}`}>{stats ? stats[c.key] : '—'}</p>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center text-sm">
        <select
          value={filters.category ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value || undefined }))}
          className="rounded-lg border border-ink-100 bg-rice-50 px-2.5 py-1.5 text-sm max-w-[12rem]"
        >
          <option value="">All categories</option>
          {categoriesData?.results.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={filters.stock ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, stock: (e.target.value || undefined) as Filters['stock'] }))}
          className="rounded-lg border border-ink-100 bg-rice-50 px-2.5 py-1.5 text-sm"
        >
          <option value="">Any stock</option>
          <option value="in">In stock</option>
          <option value="low">Low stock (≤5)</option>
          <option value="out">Out of stock</option>
        </select>
        <select
          value={filters.kind ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, kind: (e.target.value || undefined) as Filters['kind'] }))}
          className="rounded-lg border border-ink-100 bg-rice-50 px-2.5 py-1.5 text-sm"
        >
          <option value="">Single + grouped</option>
          <option value="single">Single products</option>
          <option value="grouped">Grouped (with variants)</option>
        </select>
        {Object.values(filters).some(Boolean) && (
          <button onClick={() => setFilters({})} className="text-xs font-semibold text-chili-600">
            Clear filters
          </button>
        )}
        <span className="ml-auto text-xs text-ink-300">
          {data ? `${data.count} product${data.count === 1 ? '' : 's'}` : ''} {isFetching && !isLoading ? '· updating…' : ''}
        </span>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="sticky top-14 z-10 rounded-xl bg-ink-500 text-rice-50 px-3 py-2 flex flex-wrap items-center gap-2 text-sm shadow-lg">
          <span className="font-semibold">{selected.size} selected</span>
          <select
            value={bulkCategory}
            onChange={(e) => setBulkCategory(e.target.value)}
            className="rounded-lg bg-rice-50 text-ink-500 px-2 py-1 text-sm max-w-[11rem]"
          >
            <option value="">Move to category…</option>
            {categoriesData?.results.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Button size="sm" disabled={!bulkCategory || bulk.isPending} onClick={() => bulk.mutate({ action: 'set_category', category: bulkCategory })}>
            Apply category
          </Button>
          <button onClick={() => bulk.mutate({ action: 'available' })} className="px-2 py-1 rounded-lg bg-forest-600 text-xs font-semibold">
            Show
          </button>
          <button onClick={() => bulk.mutate({ action: 'hidden' })} className="px-2 py-1 rounded-lg bg-ink-400 text-xs font-semibold">
            Hide
          </button>
          <button onClick={() => bulk.mutate({ action: 'featured' })} className="px-2 py-1 rounded-lg bg-mango-500 text-ink-500 text-xs font-semibold">
            Feature
          </button>
          <button
            onClick={() => window.confirm(`Delete ${selected.size} product(s)? This can't be undone.`) && bulk.mutate({ action: 'delete' })}
            className="px-2 py-1 rounded-lg bg-chili-600 text-xs font-semibold"
          >
            Delete
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs underline">
            Clear
          </button>
        </div>
      )}
      {bulkMsg && (
        <p className="text-sm text-forest-700" onClick={() => setBulkMsg('')}>
          {bulkMsg}
        </p>
      )}

      {/* Desktop table */}
      <div className="hidden md:block rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs text-ink-300">
              <th className="pl-4 py-3 w-8">
                <input type="checkbox" checked={allOnPageSelected} onChange={togglePage} className="accent-forest-600" aria-label="Select page" />
              </th>
              <th className="px-3 py-3 font-medium">Product</th>
              <th className="px-3 py-3 font-medium">Vendor</th>
              <th className="px-3 py-3 font-medium">Category</th>
              <th className="px-3 py-3 font-medium">Price</th>
              <th className="px-3 py-3 font-medium">Stock</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-ink-300">
                  Loading...
                </td>
              </tr>
            )}
            {rows.map((p) => (
              <tr key={p.id} className={`border-b border-ink-100/60 last:border-0 ${selected.has(p.id) ? 'bg-forest-50/60' : ''}`}>
                <td className="pl-4 py-3">
                  <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} className="accent-forest-600" aria-label={`Select ${p.name}`} />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <Thumb p={p} />
                    <div className="min-w-0">
                      <div className="font-medium text-ink-500 line-clamp-2 max-w-xs">{p.name}</div>
                      <div className="text-xs text-ink-300">
                        {p.unit}
                        {(p.variant_count ?? 0) > 0 && <span className="ml-1.5 text-forest-600 font-semibold">· {p.variant_count} variants</span>}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-ink-400">{p.vendor_name}</td>
                <td className="px-3 py-3 text-ink-400">{p.category_name}</td>
                <td className="px-3 py-3 font-mono text-ink-500 whitespace-nowrap">
                  ₹{p.selling_price}
                  {Number(p.mrp) > Number(p.selling_price) && <span className="ml-1.5 text-xs text-ink-300 line-through">₹{p.mrp}</span>}
                </td>
                <td className="px-3 py-3">
                  <StockPill qty={p.stock_quantity} />
                </td>
                <td className="px-3 py-3">
                  <StatusPill available={p.is_available} />
                </td>
                <td className="px-3 py-3">
                  <RowActions p={p} onEdit={openEdit} onVariants={setManagingProduct} onDelete={confirmRemove} />
                </td>
              </tr>
            ))}
            {data && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-ink-300">
                  Koi product nahi mila.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Phone: cards instead of a wide table */}
      <div className="md:hidden flex flex-col gap-2">
        {rows.length > 0 && (
          <label className="flex items-center gap-2 text-xs text-ink-400 px-1">
            <input type="checkbox" checked={allOnPageSelected} onChange={togglePage} className="accent-forest-600" /> Select all on this page
          </label>
        )}
        {isLoading && <p className="text-center text-ink-300 py-6">Loading...</p>}
        {rows.map((p) => (
          <div key={p.id} className={`rounded-xl border p-3 flex gap-3 ${selected.has(p.id) ? 'border-forest-600 bg-forest-50/60' : 'border-ink-100/60 bg-rice-50'}`}>
            <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} className="accent-forest-600 mt-1 shrink-0" aria-label={`Select ${p.name}`} />
            <Thumb p={p} size="h-14 w-14" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-ink-500 line-clamp-2">{p.name}</p>
              <p className="text-xs text-ink-300 truncate">
                {p.category_name} · {p.vendor_name}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="font-mono text-sm text-ink-500">₹{p.selling_price}</span>
                <StockPill qty={p.stock_quantity} />
                <StatusPill available={p.is_available} />
                {(p.variant_count ?? 0) > 0 && <span className="text-[11px] font-semibold text-forest-600">{p.variant_count} variants</span>}
              </div>
            </div>
            <RowActions p={p} onEdit={openEdit} onVariants={setManagingProduct} onDelete={confirmRemove} vertical />
          </div>
        ))}
        {data && rows.length === 0 && <p className="text-center text-ink-300 py-6">Koi product nahi mila.</p>}
      </div>

      {/* Pagination */}
      {data && data.count > 0 && (
        <div className="flex items-center justify-between gap-2 flex-wrap text-sm">
          <div className="flex items-center gap-2 text-ink-400">
            Rows
            <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="rounded-lg border border-ink-100 bg-rice-50 px-2 py-1">
              {[20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((n) => Math.max(1, n - 1))}
              disabled={page <= 1}
              className="h-8 w-8 rounded-lg border border-ink-100 flex items-center justify-center disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-ink-500">
              Page <b>{page}</b> of {totalPages}
            </span>
            <button
              onClick={() => setPage((n) => Math.min(totalPages, n + 1))}
              disabled={page >= totalPages}
              className="h-8 w-8 rounded-lg border border-ink-100 flex items-center justify-center disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

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
                    <AdminImage src={img.image} className="h-16 w-16 rounded-lg object-cover border border-ink-100" />
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
              {uploadError && <p className="text-xs text-chili-600">{uploadError}</p>}
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

type Filters = {
  category?: string
  stock?: 'in' | 'out' | 'low'
  status?: 'available' | 'hidden'
  kind?: 'single' | 'grouped'
  no_image?: boolean
}

const STAT_CARDS: { key: keyof import('@/api/admin').ProductStats; label: string; filter: Filters; tone: string }[] = [
  { key: 'total', label: 'Total products', filter: {}, tone: 'text-ink-500' },
  { key: 'available', label: 'Available', filter: { status: 'available' }, tone: 'text-forest-600' },
  { key: 'out_of_stock', label: 'Out of stock', filter: { stock: 'out' }, tone: 'text-chili-600' },
  { key: 'low_stock', label: 'Low stock (≤5)', filter: { stock: 'low' }, tone: 'text-mango-600' },
  { key: 'hidden', label: 'Hidden', filter: { status: 'hidden' }, tone: 'text-ink-400' },
  { key: 'single', label: 'Single products', filter: { kind: 'single' }, tone: 'text-ink-500' },
  { key: 'grouped', label: 'Grouped (variants)', filter: { kind: 'grouped' }, tone: 'text-forest-600' },
  { key: 'no_image', label: 'No photo', filter: { no_image: true }, tone: 'text-chili-600' },
]

function Thumb({ p, size = 'h-9 w-9' }: { p: Product; size?: string }) {
  const img = p.images.find((i) => i.is_primary) ?? p.images[0]
  return img ? (
    <AdminImage src={img.image} alt={p.name} className={`${size} shrink-0 rounded-lg object-cover border border-ink-100`} />
  ) : (
    <div className={`${size} shrink-0 rounded-lg bg-rice-100 border border-ink-100 flex items-center justify-center text-ink-200`}>
      <ImagePlus className="h-4 w-4" />
    </div>
  )
}

function StockPill({ qty }: { qty: number }) {
  const cls = qty <= 0 ? 'bg-chili-100 text-chili-600' : qty <= 5 ? 'bg-mango-100 text-mango-600' : 'bg-rice-100 text-ink-400'
  return <span className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded ${cls}`}>{qty <= 0 ? 'Out of stock' : `${qty} in stock`}</span>
}

function StatusPill({ available }: { available: boolean }) {
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${available ? 'bg-forest-100 text-forest-700' : 'bg-chili-100 text-chili-600'}`}>
      {available ? 'Available' : 'Hidden'}
    </span>
  )
}

function RowActions({
  p,
  onEdit,
  onVariants,
  onDelete,
  vertical,
}: {
  p: Product
  onEdit: (p: Product) => void
  onVariants: (p: Product) => void
  onDelete: (p: Product) => void
  vertical?: boolean
}) {
  return (
    <div className={`flex gap-3 ${vertical ? 'flex-col' : ''}`}>
      <button onClick={() => onEdit(p)} className="text-ink-300 hover:text-forest-600" aria-label="Edit">
        <Pencil className="h-4 w-4" />
      </button>
      <button onClick={() => onVariants(p)} className="text-ink-300 hover:text-forest-600" title="Attributes & variants" aria-label="Variants">
        <Layers className="h-4 w-4" />
      </button>
      <button onClick={() => onDelete(p)} className="text-ink-300 hover:text-chili-500" aria-label="Delete">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
