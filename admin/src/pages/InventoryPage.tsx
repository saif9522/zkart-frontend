import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, PackageX, Search, Trash2 } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { apiErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/Button'
import type { Product } from '@/types'

const TABS = ['all', 'low_stock', 'out_of_stock', 'expiring_soon'] as const
type Tab = (typeof TABS)[number]
const TAB_LABELS: Record<Tab, string> = {
  all: 'All products',
  low_stock: 'Low stock (≤5)',
  out_of_stock: 'Out of stock',
  expiring_soon: 'Expiring soon',
}
const STOCK_PARAM: Partial<Record<Tab, 'low' | 'out'>> = { low_stock: 'low', out_of_stock: 'out' }

export function InventoryPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [stockValue, setStockValue] = useState('')
  const [bulkQty, setBulkQty] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350)
    return () => clearTimeout(t)
  }, [search])
  useEffect(() => {
    setPage(1)
    setSelected(new Set())
  }, [tab, debounced])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', 'inventory', tab, debounced, page],
    queryFn: () => adminApi.products({ stock: STOCK_PARAM[tab], ...(debounced ? { search: debounced } : {}), page, page_size: 50 }),
    enabled: tab !== 'expiring_soon',
    placeholderData: (prev) => prev,
  })
  const { data: expiring, isLoading: loadingExpiring } = useQuery({
    queryKey: ['inventory', 'expiring-soon'],
    queryFn: adminApi.expiringStockBatches,
    enabled: tab === 'expiring_soon',
  })
  const { data: stats } = useQuery({ queryKey: ['products', 'stats'], queryFn: adminApi.productStats })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] })
    queryClient.invalidateQueries({ queryKey: ['inventory'] })
  }
  const updateOne = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) => adminApi.updateProduct(id, { stock_quantity: quantity }),
    onSuccess: () => {
      setEditingId(null)
      refresh()
    },
    onError: (e) => setMsg(apiErrorMessage(e, 'Could not update stock.')),
  })
  const removeOne = useMutation({ mutationFn: adminApi.deleteProduct, onSuccess: refresh, onError: (e) => setMsg(apiErrorMessage(e, 'Delete failed.')) })
  const bulk = useMutation({
    mutationFn: ({ action, quantity }: { action: 'set_stock' | 'out_of_stock' | 'delete'; quantity?: number }) =>
      adminApi.bulkProducts([...selected], action, undefined, quantity),
    onSuccess: (r) => {
      setMsg(`Done — ${r.updated} product(s) updated.`)
      setSelected(new Set())
      setBulkQty('')
      refresh()
    },
    onError: (e) => setMsg(apiErrorMessage(e, 'Bulk update failed.')),
  })

  const rows: Product[] = data?.results ?? []
  const totalPages = data ? Math.max(1, Math.ceil(data.count / 50)) : 1
  const allSelected = rows.length > 0 && rows.every((p) => selected.has(p.id))
  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  const saveStock = (p: Product) => {
    const q = Number(stockValue)
    if (!Number.isInteger(q) || q < 0) return setMsg('Stock 0 ya usse zyada poora number hona chahiye.')
    updateOne.mutate({ id: p.id, quantity: q })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-xl font-bold text-ink-500">Inventory</h1>
        {stats && (
          <p className="text-xs text-ink-400">
            {stats.total} products · <span className="text-chili-600 font-semibold">{stats.out_of_stock} out of stock</span> ·{' '}
            <span className="text-mango-600 font-semibold">{stats.low_stock} low</span>
          </p>
        )}
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold border ${tab === t ? 'bg-forest-600 text-rice-50 border-forest-600' : 'bg-rice-50 text-ink-400 border-ink-100'}`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
        {tab !== 'expiring_soon' && (
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products"
              className="w-full rounded-lg border border-ink-100 bg-rice-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-forest-400"
            />
          </div>
        )}
      </div>

      {selected.size > 0 && (
        <div className="sticky top-14 z-10 rounded-xl bg-ink-500 text-rice-50 px-3 py-2 flex flex-wrap items-center gap-2 text-sm shadow-lg">
          <span className="font-semibold">{selected.size} selected</span>
          <input
            value={bulkQty}
            onChange={(e) => setBulkQty(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="Stock qty"
            className="w-24 rounded-lg bg-rice-50 text-ink-500 px-2 py-1 text-sm"
          />
          <Button size="sm" disabled={bulkQty === '' || bulk.isPending} onClick={() => bulk.mutate({ action: 'set_stock', quantity: Number(bulkQty) })}>
            Set stock
          </Button>
          <button onClick={() => bulk.mutate({ action: 'out_of_stock' })} className="px-2 py-1 rounded-lg bg-mango-500 text-ink-500 text-xs font-semibold">
            Mark out of stock
          </button>
          <button
            onClick={() => window.confirm(`${selected.size} product(s) delete karein? Wapas nahi aayenge.`) && bulk.mutate({ action: 'delete' })}
            className="px-2 py-1 rounded-lg bg-chili-600 text-xs font-semibold"
          >
            Delete
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs underline">Clear</button>
        </div>
      )}
      {msg && (
        <p className="text-sm text-forest-700 bg-forest-50 rounded-lg px-3 py-2" onClick={() => setMsg('')}>{msg}</p>
      )}

      {tab !== 'expiring_soon' ? (
        <>
          <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs text-ink-300">
                  <th className="pl-4 py-3 w-8">
                    <input type="checkbox" className="accent-forest-600" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map((p) => p.id)))} aria-label="Select page" />
                  </th>
                  <th className="px-3 py-3 font-medium">Product</th>
                  <th className="px-3 py-3 font-medium hidden md:table-cell">Vendor</th>
                  <th className="px-3 py-3 font-medium">Stock</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-300">Loading...</td></tr>
                )}
                {rows.map((p) => (
                  <tr key={p.id} className={`border-b border-ink-100/60 last:border-0 ${selected.has(p.id) ? 'bg-forest-50/60' : ''}`}>
                    <td className="pl-4 py-2.5">
                      <input type="checkbox" className="accent-forest-600" checked={selected.has(p.id)} onChange={() => toggle(p.id)} aria-label={`Select ${p.name}`} />
                    </td>
                    <td className="px-3 py-2.5 text-ink-500 max-w-[16rem]"><span className="line-clamp-2">{p.name}</span></td>
                    <td className="px-3 py-2.5 text-ink-400 hidden md:table-cell">{p.vendor_name}</td>
                    <td className="px-3 py-2.5">
                      {editingId === p.id ? (
                        <form onSubmit={(e) => { e.preventDefault(); saveStock(p) }} className="flex items-center gap-1">
                          <input
                            autoFocus
                            value={stockValue}
                            onChange={(e) => setStockValue(e.target.value.replace(/[^0-9]/g, ''))}
                            className="w-16 rounded border border-forest-400 px-1.5 py-0.5 font-mono text-sm"
                          />
                          <button type="submit" className="text-xs font-semibold text-forest-700">Save</button>
                          <button type="button" onClick={() => setEditingId(null)} className="text-xs text-ink-300">✕</button>
                        </form>
                      ) : (
                        <button
                          onClick={() => { setEditingId(p.id); setStockValue(String(p.stock_quantity)) }}
                          className="font-mono underline decoration-dotted text-ink-500"
                          title="Click to edit"
                        >
                          {p.stock_quantity}
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        p.stock_quantity <= 0 ? 'bg-chili-100 text-chili-600' : p.stock_quantity <= 5 ? 'bg-mango-100 text-mango-600' : 'bg-forest-100 text-forest-700'
                      }`}>
                        {p.stock_quantity <= 0 ? 'Out of stock' : p.stock_quantity <= 5 ? 'Low stock' : 'In stock'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        {p.stock_quantity > 0 && (
                          <button onClick={() => updateOne.mutate({ id: p.id, quantity: 0 })} className="text-ink-300 hover:text-mango-600" title="Mark out of stock">
                            <PackageX className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => window.confirm(`Delete "${p.name}"?`) && removeOne.mutate(p.id)}
                          className="text-ink-300 hover:text-chili-500"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data && rows.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-300">Koi product nahi.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {data && data.count > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-xs text-ink-300">{data.count} products {isFetching && !isLoading ? '· updating…' : ''}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((n) => Math.max(1, n - 1))} disabled={page <= 1} className="h-8 w-8 rounded-lg border border-ink-100 flex items-center justify-center disabled:opacity-40" aria-label="Previous page">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span>Page <b>{page}</b> of {totalPages}</span>
                <button onClick={() => setPage((n) => Math.min(totalPages, n + 1))} disabled={page >= totalPages} className="h-8 w-8 rounded-lg border border-ink-100 flex items-center justify-center disabled:opacity-40" aria-label="Next page">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
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
