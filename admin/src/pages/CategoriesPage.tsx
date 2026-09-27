import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Home, ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { apiErrorMessage } from '@/api/client'
import { AdminImage } from '@/components/ui/AdminImage'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import type { Category } from '@/types'

const emptyForm = { name: '', parent: '', display_order: '0', is_active: true, show_on_home: true }

export function CategoriesPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'home' | 'nothome'>('all')

  const { data, isLoading } = useQuery({ queryKey: ['categories'], queryFn: adminApi.categories })
  const all = data?.results ?? []
  const topLevel = all.filter((c) => !c.parent)
  const rows = all.filter((c) => (filter === 'home' ? c.show_on_home !== false && !c.parent : filter === 'nothome' ? c.show_on_home === false : true))
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['categories'] })

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        parent: form.parent || null,
        display_order: Number(form.display_order) || 0,
        is_active: form.is_active,
        show_on_home: form.show_on_home,
      }
      const cat = editing ? await adminApi.updateCategory(editing.id, payload) : await adminApi.createCategory(payload)
      if (iconFile) await adminApi.uploadCategoryIcon(cat.id, iconFile)
      return cat
    },
    onSuccess: () => {
      invalidate()
      close()
    },
    onError: (e) => setError(apiErrorMessage(e, 'Could not save the category.')),
  })
  const quick = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Category> }) => adminApi.updateCategory(id, patch),
    onSuccess: invalidate,
    onError: (e) => setError(apiErrorMessage(e, 'Could not update.')),
  })
  const remove = useMutation({ mutationFn: adminApi.deleteCategory, onSuccess: invalidate, onError: (e) => setError(apiErrorMessage(e, 'Could not delete.')) })

  const close = () => {
    setOpen(false)
    setEditing(null)
    setForm(emptyForm)
    setIconFile(null)
    setError('')
  }
  const startEdit = (c: Category) => {
    setEditing(c)
    setForm({ name: c.name, parent: c.parent ?? '', display_order: String(c.display_order ?? 0), is_active: c.is_active, show_on_home: c.show_on_home !== false })
    setIconFile(null)
    setError('')
    setOpen(true)
  }

  const onHome = topLevel.filter((c) => c.show_on_home !== false && c.is_active).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-ink-500">Categories</h1>
          <p className="text-xs text-ink-300">
            {all.length} categories · <b>{onHome}</b> homepage ke "Shop by Category" mein dikh rahi hain (desktop pe ek line mein 10 aati hain)
          </p>
        </div>
        <Button size="sm" onClick={() => { close(); setOpen(true) }}>
          <Plus className="h-4 w-4" /> New category
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {([['all', 'All'], ['home', 'On homepage'], ['nothome', 'Hidden from homepage']] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold border ${filter === k ? 'bg-forest-600 text-rice-50 border-forest-600' : 'bg-rice-50 text-ink-400 border-ink-100'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {error && !open && <p className="text-sm text-chili-600">{error}</p>}
      {isLoading && <p className="text-ink-300 animate-pulse">Loading...</p>}

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 divide-y divide-ink-100/60">
        {rows.map((c) => (
          <div key={c.id} className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 ${c.is_active ? '' : 'opacity-50'}`}>
            <div className="h-11 w-11 shrink-0 rounded-lg bg-rice-100 border border-ink-100 overflow-hidden flex items-center justify-center">
              {c.icon ? <AdminImage src={c.icon} className="h-full w-full object-contain" /> : <ImagePlus className="h-4 w-4 text-ink-200" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-ink-500 truncate">
                {c.parent && <span className="text-ink-300">{c.parent_name} › </span>}
                {c.name}
              </p>
              <p className="text-xs text-ink-300">
                <b className="text-ink-500">{c.product_count ?? 0}</b> products · order {c.display_order}
                {!c.is_active && ' · inactive'}
              </p>
            </div>
            {!c.parent && (
              <button
                onClick={() => quick.mutate({ id: c.id, patch: { show_on_home: c.show_on_home === false } })}
                className={`hidden sm:flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  c.show_on_home !== false ? 'bg-forest-100 text-forest-700' : 'bg-ink-100 text-ink-400'
                }`}
                title="Homepage 'Shop by Category' mein dikhana hai?"
              >
                <Home className="h-3.5 w-3.5" /> {c.show_on_home !== false ? 'On home' : 'Not on home'}
              </button>
            )}
            <button onClick={() => startEdit(c)} className="text-ink-300 hover:text-forest-600" aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() =>
                window.confirm(
                  (c.product_count ?? 0) > 0
                    ? `"${c.name}" mein ${c.product_count} products hain. Delete karne se wo products bhi hat sakte hain. Pakka?`
                    : `Delete "${c.name}"?`
                ) && remove.mutate(c.id)
              }
              className="text-ink-300 hover:text-chili-500"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {data && rows.length === 0 && <p className="text-center text-ink-300 py-8">Koi category nahi.</p>}
      </div>

      <Modal open={open} onClose={close} title={editing ? `Edit ${editing.name}` : 'New category'}>
        <form onSubmit={(e) => { e.preventDefault(); setError(''); save.mutate() }} className="flex flex-col gap-3">
          <Field label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-400">Parent (blank = main category)</span>
            <select
              value={form.parent}
              onChange={(e) => setForm({ ...form, parent: e.target.value })}
              className="rounded-lg border border-ink-100 bg-rice-100 px-3 py-2 text-sm outline-none focus:border-forest-400"
            >
              <option value="">— Main category —</option>
              {topLevel.filter((c) => c.id !== editing?.id).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-400">Photo (square, like Zepto tiles)</span>
            <label className="flex items-center gap-3 rounded-lg border border-dashed border-ink-100 px-3 py-2 text-sm text-ink-400 cursor-pointer hover:border-forest-400">
              {editing?.icon && !iconFile ? (
                <AdminImage src={editing.icon} className="h-10 w-10 rounded object-contain" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              {iconFile ? iconFile.name : editing?.icon ? 'Change photo' : 'Choose photo'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setIconFile(e.target.files?.[0] ?? null)} />
            </label>
          </label>
          <Field
            label="Order (0 = first)"
            type="number"
            min={0}
            value={form.display_order}
            onChange={(e) => setForm({ ...form, display_order: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm text-ink-500">
            <input type="checkbox" className="accent-forest-600" checked={form.show_on_home} onChange={(e) => setForm({ ...form, show_on_home: e.target.checked })} />
            Homepage "Shop by Category" mein dikhao
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-500">
            <input type="checkbox" className="accent-forest-600" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active (site pe dikhe)
          </label>
          {error && <p className="text-xs text-chili-600">{error}</p>}
          <Button type="submit" loading={save.isPending}>{editing ? 'Save changes' : 'Create category'}</Button>
        </form>
      </Modal>
    </div>
  )
}
