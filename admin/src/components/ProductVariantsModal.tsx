import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

export function ProductVariantsModal({
  productId,
  productName,
  onClose,
}: {
  productId: string
  productName: string
  onClose: () => void
}) {
  const [tab, setTab] = useState<'attributes' | 'variants'>('attributes')
  const queryClient = useQueryClient()

  const { data: attributes } = useQuery({
    queryKey: ['product-attributes', productId],
    queryFn: () => adminApi.productAttributes(productId),
  })
  const { data: variants } = useQuery({
    queryKey: ['product-variants', productId],
    queryFn: () => adminApi.productVariants(productId),
  })

  const invalidateAttrs = () => queryClient.invalidateQueries({ queryKey: ['product-attributes', productId] })
  const invalidateVariants = () => queryClient.invalidateQueries({ queryKey: ['product-variants', productId] })

  const [attrForm, setAttrForm] = useState({ name: '', value: '' })
  const addAttr = useMutation({
    mutationFn: () => adminApi.createProductAttribute(productId, attrForm),
    onSuccess: () => {
      invalidateAttrs()
      setAttrForm({ name: '', value: '' })
    },
  })
  const removeAttr = useMutation({
    mutationFn: (id: string) => adminApi.deleteProductAttribute(productId, id),
    onSuccess: invalidateAttrs,
  })

  const [variantForm, setVariantForm] = useState({ name: '', mrp: '', selling_price: '', stock_quantity: '0' })
  const addVariant = useMutation({
    mutationFn: () =>
      adminApi.createProductVariant(productId, {
        name: variantForm.name,
        mrp: variantForm.mrp,
        selling_price: variantForm.selling_price,
        stock_quantity: Number(variantForm.stock_quantity),
      }),
    onSuccess: () => {
      invalidateVariants()
      setVariantForm({ name: '', mrp: '', selling_price: '', stock_quantity: '0' })
    },
  })
  const removeVariant = useMutation({
    mutationFn: (id: string) => adminApi.deleteProductVariant(productId, id),
    onSuccess: invalidateVariants,
  })

  return (
    <Modal open onClose={onClose} title={`Manage: ${productName}`}>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('attributes')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === 'attributes' ? 'bg-forest-600 text-rice-50' : 'bg-rice-100 text-ink-400'}`}
        >
          Attributes
        </button>
        <button
          onClick={() => setTab('variants')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === 'variants' ? 'bg-forest-600 text-rice-50' : 'bg-rice-100 text-ink-400'}`}
        >
          Variants
        </button>
      </div>

      {tab === 'attributes' ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
            {(attributes ?? []).map((a) => (
              <div key={a.id} className="flex items-center gap-2 rounded-lg bg-rice-100 px-3 py-2 text-sm">
                <span className="font-medium text-ink-500">{a.name}</span>
                <span className="text-ink-400 flex-1">{a.value}</span>
                <button onClick={() => removeAttr.mutate(a.id)} className="text-ink-300 hover:text-chili-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {attributes && attributes.length === 0 && <p className="text-xs text-ink-300 text-center py-3">No attributes yet.</p>}
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
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
            {(variants ?? []).map((v) => (
              <div key={v.id} className="flex items-center gap-2 rounded-lg bg-rice-100 px-3 py-2 text-sm">
                <span className="font-medium text-ink-500 flex-1">{v.name}</span>
                <span className="text-ink-400 font-mono">₹{v.selling_price}</span>
                <span className="text-xs text-ink-300">Stock: {v.stock_quantity}</span>
                <button onClick={() => removeVariant.mutate(v.id)} className="text-ink-300 hover:text-chili-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {variants && variants.length === 0 && <p className="text-xs text-ink-300 text-center py-3">No variants yet.</p>}
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
