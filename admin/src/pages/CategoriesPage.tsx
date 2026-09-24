import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Plus, Trash2 } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import type { Category } from '@/types'

export function CategoriesPage() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [parent, setParent] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey: ['categories'], queryFn: adminApi.categories })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  const create = useMutation({
    mutationFn: () => adminApi.createCategory({ name, parent: parent || null, display_order: 0 }),
    onSuccess: () => {
      invalidate()
      setOpen(false)
      setName('')
      setParent('')
    },
  })
  const remove = useMutation({ mutationFn: adminApi.deleteCategory, onSuccess: invalidate })
  const uploadIcon = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => adminApi.uploadCategoryIcon(id, file),
    onSuccess: invalidate,
  })

  const handleIconChange = (id: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadIcon.mutate({ id, file })
    e.target.value = ''
  }

  const IconBadge = ({ cat, size = 'h-9 w-9' }: { cat: Category; size?: string }) => (
    <label className={`relative ${size} shrink-0 rounded-lg border border-dashed border-ink-100 bg-rice-100 flex items-center justify-center cursor-pointer hover:border-forest-400 overflow-hidden`}>
      {cat.icon ? (
        <img src={cat.icon} alt="" className="h-full w-full object-contain" />
      ) : (
        <ImagePlus className="h-4 w-4 text-ink-300" />
      )}
      <input type="file" accept="image/*" className="hidden" onChange={handleIconChange(cat.id)} />
    </label>
  )

  const topLevel = data?.results.filter((c) => !c.parent) ?? []
  const childrenOf = (id: string) => data?.results.filter((c) => c.parent === id) ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-500">Categories</h1>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New category
        </Button>
      </div>

      {isLoading && <p className="text-ink-300 animate-pulse">Loading...</p>}

      <div className="flex flex-col gap-3">
        {topLevel.map((cat) => (
          <div key={cat.id} className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <IconBadge cat={cat} />
                <span className="font-semibold text-ink-500">{cat.name}</span>
              </div>
              <button onClick={() => remove.mutate(cat.id)} className="text-ink-300 hover:text-chili-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {childrenOf(cat.id).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pl-3 border-l-2 border-forest-100">
                {childrenOf(cat.id).map((child) => (
                  <span
                    key={child.id}
                    className="flex items-center gap-1.5 text-xs bg-rice-100 border border-ink-100 rounded-full pl-1 pr-3 py-1"
                  >
                    <IconBadge cat={child} size="h-6 w-6" />
                    {child.name}
                    <button onClick={() => remove.mutate(child.id)} className="text-ink-300 hover:text-chili-500">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {data && topLevel.length === 0 && <p className="text-ink-300 text-center py-8">No categories yet.</p>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New category">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            create.mutate()
          }}
          className="flex flex-col gap-3"
        >
          <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-400">Parent category (optional)</span>
            <select
              value={parent}
              onChange={(e) => setParent(e.target.value)}
              className="rounded-lg border border-ink-100 bg-rice-100 px-3 py-2 text-sm outline-none focus:border-forest-400"
            >
              <option value="">— Top level —</option>
              {topLevel.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-ink-300">Category ban jaane ke baad, icon list mein us par click karke upload kar sakte hain.</p>
          <Button type="submit" loading={create.isPending} className="mt-2">
            Create category
          </Button>
        </form>
      </Modal>
    </div>
  )
}
