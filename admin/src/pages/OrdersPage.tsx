import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatINR } from '@/lib/utils'

const STATUS_OPTIONS = ['', 'placed', 'accepted', 'packing', 'ready', 'pickup', 'out_for_delivery', 'nearby', 'delivered', 'cancelled']

export function OrdersPage() {
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', status, search],
    queryFn: () => adminApi.orders({ status: status || undefined, search: search || undefined }),
  })

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-ink-500">Orders</h1>

      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order #, customer, vendor..."
          className="rounded-lg border border-ink-100 px-3 py-2 text-sm w-64 outline-none focus:border-forest-400"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-forest-400 capitalize"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s ? s.replace(/_/g, ' ') : 'All statuses'}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs text-ink-300">
              <th className="px-4 py-3 font-medium">Order #</th>
              <th className="px-4 py-3 font-medium">Vendor</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Placed</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-300">Loading...</td>
              </tr>
            )}
            {data?.results.map((o) => (
              <tr key={o.id} className="border-b border-ink-100/60 last:border-0">
                <td className="px-4 py-3 font-mono text-xs text-ink-500">{o.order_number}</td>
                <td className="px-4 py-3 text-ink-400">{o.vendor_name}</td>
                <td className="px-4 py-3 font-mono text-ink-400">{o.item_count}</td>
                <td className="px-4 py-3 font-mono text-ink-500 font-semibold">{formatINR(o.grand_total)}</td>
                <td className="px-4 py-3 text-ink-400">
                  <span className="uppercase text-xs">{o.payment_method}</span>
                  <span className="text-ink-200"> · </span>
                  <Badge status={o.payment_status} />
                </td>
                <td className="px-4 py-3">
                  <Badge status={o.status} />
                </td>
                <td className="px-4 py-3 text-xs text-ink-300">{formatDate(o.placed_at)}</td>
              </tr>
            ))}
            {data && data.results.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-300">No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
