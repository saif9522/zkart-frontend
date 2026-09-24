import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { vendorApi } from '@/api/vendor'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

export function ProductVariantsModal({
  productSlug,
  productName,
  onClose,
}: {
  productSlug: string
  productName: string
  onClose: () => void
}) {
  const [tab, setTab] = useState<'attributes' | 'variants' | 'images'>('images')
  const queryClient = useQueryClient()

  const { data: detail } = useQuery({
    queryKey: ['product-detail', productSlug],
    queryFn: () => vendorApi.productDetail(productSlug),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['product-detail', productSlug] })

  const [attrForm, setAttrForm] = useState({ name: '', value: '' })
  const addAttr = useMutation({
    mutationFn: () => vendorApi.addProductAttribute(productSlug, attrForm),
    onSuccess: () => {
      invalidate()
      setAttrForm({ name: '', value: '' })
    },
  })
  const removeAttr = useMutation({
    mutationFn: (id: string) => vendorApi.removeProductAttribute(productSlug, id),
    onSuccess: invalidate,
  })

  const [variantForm, setVariantForm] = useState({ name: '', mrp: '', selling_price: '', stock_quantity: '0' })
  const addVariant = useMutation({
    mutationFn: () =>
      vendorApi.addProductVariant(productSlug, {
        name: variantForm.name,
        mrp: variantForm.mrp,
        selling_price: variantForm.selling_price,
        stock_quantity: Number(variantForm.stock_quantity),
      }),
    onSuccess: () => {
      invalidate()
      setVariantForm({ name: '', mrp: '', selling_price: '', stock_quantity: '0' })
    },
  })
  const removeVariant = useMutation({
    mutationFn: (id: string) => vendorApi.removeProductVariant(productSlug, id),
    onSuccess: invalidate,
  })

  const uploadImage = useMutation({
    mutationFn: (file: File) => vendorApi.addProductImage(productSlug, file, (detail?.images.length ?? 0) === 0),
    onSuccess: invalidate,
  })
  const removeImage = useMutation({
    mutationFn: (id: string) => vendorApi.removeProductImage(productSlug, id),
    onSuccess: invalidate,
  })

  return (
    <Modal open onClose={onClose} title={`Manage: ${productName}`}>
      <div className="flex gap-2 mb-4">
        {(['images', 'attributes', 'variants'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-forest-600 text-rice-50' : 'bg-rice-100 text-ink-400'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'images' && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-4 gap-2">
            {(detail?.images ?? []).map((img) => (
              <div key={img.id} className="relative">
                <img src={img.image} alt="" className="h-16 w-16 rounded-lg object-cover" />
                <button
                  onClick={() => removeImage.mutate(img.id)}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-chili-500 text-rice-50 flex items-center justify-center"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <label className="inline-flex items-center gap-1.5 rounded-lg bg-rice-100 text-ink-400 text-sm px-3 py-2 cursor-pointer hover:bg-rice-200 w-fit">
            <Plus className="h-3.5 w-3.5" /> {uploadImage.isPending ? 'Uploading...' : 'Add image'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadImage.mutate(file)
                e.target.value = ''
              }}
            />
          </label>
        </div>
      )}

      {tab === 'attributes' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
            {(detail?.attributes ?? []).map((a) => (
              <div key={a.id} className="flex items-center gap-2 rounded-lg bg-rice-100 px-3 py-2 text-sm">
                <span className="font-medium text-ink-500">{a.name}</span>
                <span className="text-ink-400 flex-1">{a.value}</span>
                <button onClick={() => removeAttr.mutate(a.id)} className="text-ink-300 hover:text-chili-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {detail && detail.attributes.length === 0 && <p className="text-xs text-ink-300 text-center py-3">No attributes yet.</p>}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (attrForm.name && attrForm.value) addAttr.mutate()
            }}
            className="flex gap-2"
          >
            <input
              placeholder="Name (e.g. Material)"
              value={attrForm.name}
              onChange={(e) => setAttrForm({ ...attrForm, name: e.target.value })}
              className="flex-1 rounded-lg border border-ink-100 px-2.5 py-1.5 text-sm outline-none focus:border-forest-400"
            />
            <input
              placeholder="Value (e.g. Cotton)"
              value={attrForm.value}
              onChange={(e) => setAttrForm({ ...attrForm, value: e.target.value })}
              className="flex-1 rounded-lg border border-ink-100 px-2.5 py-1.5 text-sm outline-none focus:border-forest-400"
            />
            <Button type="submit" size="sm" loading={addAttr.isPending}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      )}

      {tab === 'variants' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
            {(detail?.variants ?? []).map((v) => (
              <div key={v.id} className="flex items-center gap-2 rounded-lg bg-rice-100 px-3 py-2 text-sm">
                <span className="font-medium text-ink-500 flex-1">{v.name}</span>
                <span className="text-ink-400 font-mono">₹{v.selling_price}</span>
                <span className="text-xs text-ink-300">Stock: {v.stock_quantity}</span>
                <button onClick={() => removeVariant.mutate(v.id)} className="text-ink-300 hover:text-chili-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {detail && detail.variants.length === 0 && <p className="text-xs text-ink-300 text-center py-3">No variants yet.</p>}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (variantForm.name && variantForm.mrp && variantForm.selling_price) addVariant.mutate()
            }}
            className="grid grid-cols-2 gap-2"
          >
            <input
              placeholder="Name (e.g. 1 kg)"
              value={variantForm.name}
              onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
              className="col-span-2 rounded-lg border border-ink-100 px-2.5 py-1.5 text-sm outline-none focus:border-forest-400"
            />
            <input
              placeholder="MRP"
              type="number"
              value={variantForm.mrp}
              onChange={(e) => setVariantForm({ ...variantForm, mrp: e.target.value })}
              className="rounded-lg border border-ink-100 px-2.5 py-1.5 text-sm outline-none focus:border-forest-400"
            />
            <input
              placeholder="Selling price"
              type="number"
              value={variantForm.selling_price}
              onChange={(e) => setVariantForm({ ...variantForm, selling_price: e.target.value })}
              className="rounded-lg border border-ink-100 px-2.5 py-1.5 text-sm outline-none focus:border-forest-400"
            />
            <input
              placeholder="Stock"
              type="number"
              value={variantForm.stock_quantity}
              onChange={(e) => setVariantForm({ ...variantForm, stock_quantity: e.target.value })}
              className="rounded-lg border border-ink-100 px-2.5 py-1.5 text-sm outline-none focus:border-forest-400"
            />
            <Button type="submit" size="sm" loading={addVariant.isPending}>
              <Plus className="h-3.5 w-3.5" /> Add variant
            </Button>
          </form>
        </div>
      )}
    </Modal>
  )
}
