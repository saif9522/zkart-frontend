import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Star, Trash2 } from 'lucide-react'
import { vendorApi } from '@/api/vendor'
import { apiErrorMessage } from '@/api/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'

export function InventoryPage() {
  const [tab, setTab] = useState<'batches' | 'ledger' | 'warehouses'>('batches')
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'batch' | 'adjustment' | 'warehouse'>('batch')
  const queryClient = useQueryClient()

  const { data: products } = useQuery({ queryKey: ['vendor-products-all'], queryFn: () => vendorApi.myProducts() })
  const { data: batches, isLoading: batchesLoading } = useQuery({
    queryKey: ['vendor-stock-batches'],
    queryFn: vendorApi.stockBatches,
  })
  const { data: movements, isLoading: movementsLoading } = useQuery({
    queryKey: ['vendor-stock-movements'],
    queryFn: vendorApi.stockMovements,
  })
  const { data: warehouses, isLoading: warehousesLoading } = useQuery({
    queryKey: ['vendor-warehouses'],
    queryFn: vendorApi.warehouses,
  })

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['vendor-stock-batches'] })
    queryClient.invalidateQueries({ queryKey: ['vendor-stock-movements'] })
    queryClient.invalidateQueries({ queryKey: ['vendor-warehouses'] })
    queryClient.invalidateQueries({ queryKey: ['vendor-products'] })
    queryClient.invalidateQueries({ queryKey: ['vendor-dashboard'] })
  }

  const [batchForm, setBatchForm] = useState({ product: '', quantity: '', purchase_price: '', supplier_name: '', warehouse: '' })
  const [adjForm, setAdjForm] = useState({ product: '', quantity_delta: '', notes: '' })
  const [warehouseForm, setWarehouseForm] = useState({ name: '', address_line: '', is_default: false })
  const [formError, setFormError] = useState('')

  const createBatch = useMutation({
    mutationFn: () =>
      vendorApi.createStockBatch({
        product: batchForm.product,
        quantity: Number(batchForm.quantity),
        purchase_price: batchForm.purchase_price,
        supplier_name: batchForm.supplier_name,
        warehouse: batchForm.warehouse || undefined,
      }),
    onSuccess: () => {
      invalidateAll()
      closeModal()
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'Could not add stock.')),
  })

  const createAdjustment = useMutation({
    mutationFn: () =>
      vendorApi.createAdjustment({
        product: adjForm.product,
        quantity_delta: Number(adjForm.quantity_delta),
        notes: adjForm.notes,
      }),
    onSuccess: () => {
      invalidateAll()
      closeModal()
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'Could not record the adjustment.')),
  })

  const createWarehouse = useMutation({
    mutationFn: () => vendorApi.createWarehouse(warehouseForm),
    onSuccess: () => {
      invalidateAll()
      closeModal()
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'Could not add warehouse.')),
  })

  const setDefaultWarehouse = useMutation({
    mutationFn: (id: string) => vendorApi.updateWarehouse(id, { is_default: true }),
    onSuccess: invalidateAll,
  })

  const removeBatch = useMutation({ mutationFn: vendorApi.deleteStockBatch, onSuccess: invalidateAll })
  const removeAdjustment = useMutation({ mutationFn: vendorApi.deleteAdjustment, onSuccess: invalidateAll })
  const removeWarehouse = useMutation({ mutationFn: vendorApi.deleteWarehouse, onSuccess: invalidateAll })

  const closeModal = () => {
    setOpen(false)
    setBatchForm({ product: '', quantity: '', purchase_price: '', supplier_name: '', warehouse: '' })
    setAdjForm({ product: '', quantity_delta: '', notes: '' })
    setWarehouseForm({ name: '', address_line: '', is_default: false })
    setFormError('')
  }

  const productOptions = products?.results ?? []
  const warehouseOptions = warehouses?.results ?? []

  const modeForTab = { batches: 'batch', ledger: 'adjustment', warehouses: 'warehouse' } as const
  const labelForTab = { batches: 'Receive stock', ledger: 'Manual adjustment', warehouses: 'Add warehouse' } as const

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-500">Inventory</h1>
        <Button
          size="sm"
          onClick={() => {
            setMode(modeForTab[tab])
            setFormError('')
            setOpen(true)
          }}
        >
          <Plus className="h-4 w-4" /> {labelForTab[tab]}
        </Button>
      </div>

      <div className="flex gap-2">
        {(['batches', 'ledger', 'warehouses'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-forest-600 text-rice-50' : 'bg-rice-100 text-ink-400'}`}
          >
            {t === 'batches' ? 'Stock Batches' : t === 'ledger' ? 'Stock Ledger' : 'Warehouses'}
          </button>
        ))}
      </div>

      {tab === 'batches' && (
        <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 divide-y divide-ink-100/60">
          {batchesLoading && <p className="text-ink-300 animate-pulse p-4">Loading...</p>}
          {(batches?.results ?? []).map((b) => (
            <div key={b.id} className="flex items-center gap-3 p-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-ink-500">{b.product_name}</p>
                <p className="text-xs text-ink-300">
                  {b.quantity} units · ₹{b.purchase_price}/unit
                  {b.warehouse_name && ` · ${b.warehouse_name}`}
                  {b.expiry_date && ` · Expires ${b.expiry_date}`}
                </p>
              </div>
              {b.is_expired && <Badge status="failed" label="Expired" />}
              <button onClick={() => removeBatch.mutate(b.id)} className="text-ink-300 hover:text-chili-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {batches && batches.results.length === 0 && <p className="text-ink-300 text-center py-8">No stock batches yet.</p>}
        </div>
      )}

      {tab === 'ledger' && (
        <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 divide-y divide-ink-100/60">
          {movementsLoading && <p className="text-ink-300 animate-pulse p-4">Loading...</p>}
          {(movements?.results ?? []).map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-ink-500">{m.product_name}</p>
                <p className="text-xs text-ink-300">
                  {m.movement_type} · {m.reference || m.notes || '—'} · {new Date(m.created_at).toLocaleDateString()}
                </p>
              </div>
              <span className={`font-mono text-sm ${m.quantity_delta >= 0 ? 'text-forest-600' : 'text-chili-600'}`}>
                {m.quantity_delta >= 0 ? '+' : ''}{m.quantity_delta}
              </span>
              <span className="text-xs text-ink-300">→ {m.resulting_stock}</span>
              {m.movement_type === 'adjustment' && (
                <button onClick={() => removeAdjustment.mutate(m.id)} className="text-ink-300 hover:text-chili-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {movements && movements.results.length === 0 && <p className="text-ink-300 text-center py-8">No stock movements yet.</p>}
        </div>
      )}

      {tab === 'warehouses' && (
        <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 divide-y divide-ink-100/60">
          {warehousesLoading && <p className="text-ink-300 animate-pulse p-4">Loading...</p>}
          {warehouseOptions.map((w) => (
            <div key={w.id} className="flex items-center gap-3 p-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-ink-500">{w.name}</p>
                <p className="text-xs text-ink-300">{w.address_line || '—'}</p>
              </div>
              {w.is_default ? (
                <Badge status="active" label="Default" />
              ) : (
                <button
                  onClick={() => setDefaultWarehouse.mutate(w.id)}
                  className="flex items-center gap-1 text-xs text-ink-300 hover:text-forest-600"
                >
                  <Star className="h-3.5 w-3.5" /> Set default
                </button>
              )}
              <button onClick={() => removeWarehouse.mutate(w.id)} className="text-ink-300 hover:text-chili-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {warehouses && warehouseOptions.length === 0 && (
            <p className="text-ink-300 text-center py-8">
              No warehouses yet — most shops don't need more than one. Add extras only if you store stock in multiple places.
            </p>
          )}
        </div>
      )}

      <Modal
        open={open}
        onClose={closeModal}
        title={mode === 'batch' ? 'Receive stock' : mode === 'adjustment' ? 'Manual adjustment' : 'New warehouse'}
      >
        {mode === 'batch' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              createBatch.mutate()
            }}
            className="flex flex-col gap-3"
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-ink-400">Product</span>
              <select
                value={batchForm.product}
                onChange={(e) => setBatchForm({ ...batchForm, product: e.target.value })}
                required
                className="rounded-lg border border-ink-100 bg-rice-100 px-3 py-2 text-sm outline-none focus:border-forest-400"
              >
                <option value="">Select a product</option>
                {productOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            {warehouseOptions.length > 0 && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink-400">Warehouse (optional)</span>
                <select
                  value={batchForm.warehouse}
                  onChange={(e) => setBatchForm({ ...batchForm, warehouse: e.target.value })}
                  className="rounded-lg border border-ink-100 bg-rice-100 px-3 py-2 text-sm outline-none focus:border-forest-400"
                >
                  <option value="">Not specified</option>
                  {warehouseOptions.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <Field
              label="Quantity received"
              type="number"
              value={batchForm.quantity}
              onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value })}
              required
            />
            <Field
              label="Purchase price per unit"
              type="number"
              value={batchForm.purchase_price}
              onChange={(e) => setBatchForm({ ...batchForm, purchase_price: e.target.value })}
              required
            />
            <Field
              label="Supplier (optional)"
              value={batchForm.supplier_name}
              onChange={(e) => setBatchForm({ ...batchForm, supplier_name: e.target.value })}
            />
            {formError && <p className="text-xs text-chili-600">{formError}</p>}
            <Button type="submit" loading={createBatch.isPending} className="mt-2">
              Add stock
            </Button>
          </form>
        )}

        {mode === 'adjustment' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              createAdjustment.mutate()
            }}
            className="flex flex-col gap-3"
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-ink-400">Product</span>
              <select
                value={adjForm.product}
                onChange={(e) => setAdjForm({ ...adjForm, product: e.target.value })}
                required
                className="rounded-lg border border-ink-100 bg-rice-100 px-3 py-2 text-sm outline-none focus:border-forest-400"
              >
                <option value="">Select a product</option>
                {productOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <Field
              label="Quantity change (negative for damage/loss, e.g. -5)"
              type="number"
              value={adjForm.quantity_delta}
              onChange={(e) => setAdjForm({ ...adjForm, quantity_delta: e.target.value })}
              required
            />
            <Field label="Reason" value={adjForm.notes} onChange={(e) => setAdjForm({ ...adjForm, notes: e.target.value })} />
            {formError && <p className="text-xs text-chili-600">{formError}</p>}
            <Button type="submit" loading={createAdjustment.isPending} className="mt-2">
              Save adjustment
            </Button>
          </form>
        )}

        {mode === 'warehouse' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              createWarehouse.mutate()
            }}
            className="flex flex-col gap-3"
          >
            <Field
              label="Name (e.g. 'Main shop', 'Cold storage')"
              value={warehouseForm.name}
              onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
              required
              autoFocus
            />
            <Field
              label="Address (optional)"
              value={warehouseForm.address_line}
              onChange={(e) => setWarehouseForm({ ...warehouseForm, address_line: e.target.value })}
            />
            <label className="flex items-center gap-2 text-xs text-ink-400">
              <input
                type="checkbox"
                checked={warehouseForm.is_default}
                onChange={(e) => setWarehouseForm({ ...warehouseForm, is_default: e.target.checked })}
                className="accent-forest-600"
              />
              Set as default warehouse
            </label>
            {formError && <p className="text-xs text-chili-600">{formError}</p>}
            <Button type="submit" loading={createWarehouse.isPending} className="mt-2">
              Add warehouse
            </Button>
          </form>
        )}
      </Modal>
    </div>
  )
}
