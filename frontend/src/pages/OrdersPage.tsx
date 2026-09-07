import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PackageOpen } from 'lucide-react'
import { ordersApi } from '@/api/orders'
import { formatINR, cn } from '@/lib/utils'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/orderStatus'

export function OrdersPage() {
  const { data, isLoading } = useQuery({ queryKey: ['orders'], queryFn: () => ordersApi.list() })

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <h1 className="font-display text-xl font-semibold text-ink-500 mb-4">Your orders</h1>

      {isLoading && <p className="text-ink-300 animate-pulse">Loading...</p>}

      {data && data.results.length === 0 && (
        <div className="text-center py-20">
          <PackageOpen className="h-12 w-12 text-ink-200 mx-auto" />
          <p className="text-ink-400 font-medium mt-4">No orders yet</p>
          <Link to="/" className="text-forest-600 text-sm font-medium">
            Start shopping
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {data?.results.map((order) => (
          <Link
            key={order.id}
            to={`/orders/${order.id}`}
            className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4 flex items-center justify-between hover:border-forest-400 transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-ink-500">{order.vendor_name}</p>
              <p className="text-xs text-ink-300 font-mono mt-0.5">{order.order_number}</p>
              <p className="text-xs text-ink-300 mt-1">
                {order.item_count} item{order.item_count !== 1 ? 's' : ''} · {formatINR(order.grand_total)}
              </p>
            </div>
            <span className={cn('text-xs font-semibold rounded-full px-2.5 py-1', STATUS_COLORS[order.status])}>
              {STATUS_LABELS[order.status]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
