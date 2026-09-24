import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'

const TABS = ['all', 'low_stock', 'out_of_stock', 'expiring_soon'] as const
type Tab = (typeof TABS)[number]

const TAB_LABELS: Record<Tab, string> = {
  all: 'All products',
  low_stock: 'Low stock',
  out_of_stock: 'Out of stock',
  expiring_soon: 'Expiring soon',
}

export function InventoryPage() {
  const [tab, setTab] = useState<Tab>('all')
  const [editingStock, setEditingStock] = useState<string | null>(null)
  const [stockValue, setStockValue] = useState('')
  const queryClient = useQueryClient()

  const { data: allProducts, isLoading: loadingAll } = useQuery({
    queryKey: ['products', 'inventory'],
    queryFn: () => adminApi.products(),
    enabled: tab === 'all' || tab === 'out_of_stock',
  })
  const { data: lowStock, isLoading: loadingLow } = useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: adminApi.lowStockProducts,
    enabled: tab === 'low_stock',
  })
  const { data: expiring, isLoading: loadingExpiring } = useQuery({
    queryKey: ['inventory', 'expiring-soon'],
    queryFn: adminApi.expiringStockBatches,
    enabled: tab === 'expiring_soon',
  })

  const updateStock = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      adminApi.updateProduct(id, { stock_quantity: quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      setEditingStock(null)
    },
  })

  const productRows =
    tab === 'out_of_stock'
      ? allProducts?.results.filter((p) => p.stock_quantity === 0)
      : allProducts?.results

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-ink-500">Inventory</h1>

      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
              tab === t ? 'bg-forest-600 text-rice-50' : 'bg-rice-50 border border-ink-100 text-ink-400'
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab !== 'expiring_soon' ? (
        <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-300">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Vendor</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(loadingAll || loadingLow) && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-ink-300">
                    Loading...
                  </td>
                </tr>
              )}
              {(tab === 'low_stock' ? lowStock : productRows)?.map((p) => (
                <tr key={p.id} className="border-b border-ink-100/60 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink-500">{p.name}</td>
                  <td className="px-4 py-3 text-ink-400">{p.vendor_name}</td>
                  <td className="px-4 py-3">
                    {editingStock === p.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={stockValue}
                          onChange={(e) => setStockValue(e.target.value)}
                          className="w-20 rounded border border-ink-100 px-1.5 py-1 text-xs font-mono"
                          autoFocus
                        />
                        <button
                          onClick={() => updateStock.mutate({ id: p.id, quantity: Number(stockValue) })}
                          className="text-xs text-forest-600 font-semibold"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingStock(p.id)
                          setStockValue(String(p.stock_quantity))
                        }}
                        className="font-mono text-ink-500 hover:text-forest-600 underline decoration-dotted"
                      >
                        {p.stock_quantity}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        p.stock_quantity === 0
                          ? 'bg-chili-100 text-chili-600'
                          : p.stock_quantity <= 10
                            ? 'bg-mango-100 text-mango-700'
                            : 'bg-forest-100 text-forest-700'
                      }`}
                    >
                      {p.stock_quantity === 0 ? 'Out of stock' : p.stock_quantity <= 10 ? 'Low stock' : 'In stock'}
                    </span>
                  </td>
                </tr>
              ))}
              {(tab === 'low_stock' ? lowStock : productRows)?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-ink-300">
                    Koi product nahi mila.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-300">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Batch</th>
                <th className="px-4 py-3 font-medium">Quantity</th>
                <th className="px-4 py-3 font-medium">Expiry</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
              </tr>
            </thead>
            <tbody>
              {loadingExpiring && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-ink-300">
                    Loading...
                  </td>
                </tr>
              )}
              {expiring?.map((b) => (
                <tr key={b.id} className="border-b border-ink-100/60 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink-500">{b.product_name}</td>
                  <td className="px-4 py-3 text-ink-400">{b.batch_number || '—'}</td>
                  <td className="px-4 py-3 font-mono text-ink-400">{b.quantity}</td>
                  <td className="px-4 py-3 text-chili-600 font-medium">{b.expiry_date}</td>
                  <td className="px-4 py-3 text-ink-400">{b.supplier_name || '—'}</td>
                </tr>
              ))}
              {expiring?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-ink-300">
                    Koi batch expire nahi ho raha.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
