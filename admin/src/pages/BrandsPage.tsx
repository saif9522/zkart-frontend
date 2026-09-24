import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { apiErrorMessage } from '@/api/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import type { Brand } from '@/types'

export function BrandsPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Brand | null>(null)
  const [name, setName] = useState('')
  const [formError, setFormError] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey: ['brands'], queryFn: () => adminApi.brands() })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['brands'] })

  const create = useMutation({
    mutationFn: () => adminApi.createBrand({ name }),
    onSuccess: () => {
      invalidate()
      closeModal()
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'Could not create the brand.')),
  })

  const update = useMutation({
    mutationFn: () => adminApi.updateBrand(editing!.id, { name }),
    onSuccess: () => {
      invalidate()
      closeModal()
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'Could not save the brand.')),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => adminApi.updateBrand(id, { is_active }),
    onSuccess: invalidate,
  })

  const remove = useMutation({ mutationFn: adminApi.deleteBrand, onSuccess: invalidate })

  const uploadLogo = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => adminApi.uploadBrandLogo(id, file),
    onSuccess: invalidate,
  })

  const closeModal = () => {
    setOpen(false)
    setEditing(null)
    setName('')
    setFormError('')
  }

  const startCreate = () => {
    setEditing(null)
    setName('')
    setFormError('')
    setOpen(true)
  }

  const startEdit = (brand: Brand) => {
    setEditing(brand)
    setName(brand.name)
    setFormError('')
    setOpen(true)
  }

  const handleLogoChange = (id: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadLogo.mutate({ id, file })
    e.target.value = ''
  }

  const brands = data?.results ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-500">Brands</h1>
        <Button size="sm" onClick={startCreate}>
          <Plus className="h-4 w-4" /> New brand
        </Button>
      </div>

      {isLoading && <p className="text-ink-300 animate-pulse">Loading...</p>}

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 divide-y divide-ink-100/60">
        {brands.map((brand) => (
          <div key={brand.id} className="flex items-center gap-3 p-3">
            <label className="relative h-9 w-9 shrink-0 rounded-lg border border-dashed border-ink-100 bg-rice-100 flex items-center justify-center cursor-pointer hover:border-forest-400 overflow-hidden">
              {brand.logo ? (
                <img src={brand.logo} alt="" className="h-full w-full object-contain" />
              ) : (
                <ImagePlus className="h-4 w-4 text-ink-300" />
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange(brand.id)} />
            </label>
            <span className="flex-1 font-semibold text-ink-500">{brand.name}</span>
            <button onClick={() => toggleActive.mutate({ id: brand.id, is_active: !brand.is_active })}>
              <Badge status={brand.is_active ? 'active' : 'inactive'} />
            </button>
            <button onClick={() => startEdit(brand)} className="text-ink-300 hover:text-forest-600">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => remove.mutate(brand.id)} className="text-ink-300 hover:text-chili-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {data && brands.length === 0 && <p className="text-ink-300 text-center py-8">No brands yet.</p>}
      </div>

      <Modal open={open} onClose={closeModal} title={editing ? 'Edit brand' : 'New brand'}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            editing ? update.mutate() : create.mutate()
          }}
          className="flex flex-col gap-3"
        >
          <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          {formError && <p className="text-xs text-chili-600">{formError}</p>}
          <p className="text-xs text-ink-300">Brand ban jaane ke baad, list mein logo par click karke upload kar sakte hain.</p>
          <Button type="submit" loading={create.isPending || update.isPending} className="mt-2">
            {editing ? 'Save changes' : 'Create brand'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
