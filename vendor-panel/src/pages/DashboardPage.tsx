import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Clock, IndianRupee, Package, ShoppingBag, Star, Store } from 'lucide-react'
import { vendorApi } from '@/api/vendor'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { ShopOpenToggle } from '@/pages/SettingsPage'
import { PushPrompt } from '@/components/PushPrompt'

export function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['vendor-dashboard'], queryFn: vendorApi.dashboard })

  if (isLoading) return <p className="text-ink-300 animate-pulse">Loading...</p>
  if (!data) return null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-500 flex items-center gap-2">
            <Store className="h-5 w-5 text-forest-600" /> {data.shop_name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge status={data.status === 'approved' ? 'approved' : data.status} />
            <Badge status={data.is_open ? 'active' : 'inactive'} label={data.is_open ? 'Open' : 'Closed'} />
          </div>
        </div>
      </div>

      {data.status === 'approved' && <ShopOpenToggle />}
      <PushPrompt who="shop" />

      {data.status === 'pending' && (
        <div className="rounded-xl bg-mango-50 border border-mango-100 p-4 text-sm text-ink-500 flex items-center gap-2">
          <Clock className="h-4 w-4 text-mango-600 shrink-0" />
          Your shop is awaiting approval. You can add products now, but they won't be visible to customers until approved.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Orders today" value={data.orders_today} icon={ShoppingBag} />
        <StatCard label="Revenue today" value={`₹${data.revenue_today}`} icon={IndianRupee} />
        <StatCard label="Products" value={data.products.total} icon={Package} />
        <StatCard label="Wallet balance" value={`₹${data.earnings.balance}`} icon={IndianRupee} />
      </div>

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4 flex items-center gap-3">
        <Star className="h-6 w-6 text-mango-500 fill-mango-500 shrink-0" />
        {data.rating?.average ? (
          <p className="text-sm text-ink-500">
            <span className="font-mono text-lg font-bold">{data.rating.average}</span> / 5 customer rating
            <span className="text-ink-300"> · {data.rating.count} review{data.rating.count === 1 ? '' : 's'}</span>
          </p>
        ) : (
          <p className="text-sm text-ink-300">No ratings yet — customers can rate you after each delivery.</p>
        )}
      </div>

      {(data.products.low_stock > 0 || data.products.out_of_stock > 0 || data.products.batches_expiring_soon > 0) && (
        <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4">
          <h2 className="text-sm font-semibold text-ink-500 flex items-center gap-1.5 mb-2">
            <AlertTriangle className="h-4 w-4 text-chili-500" /> Needs attention
          </h2>
          <div className="flex flex-col gap-1.5 text-sm text-ink-400">
            {data.products.out_of_stock > 0 && <p>{data.products.out_of_stock} product(s) out of stock</p>}
            {data.products.low_stock > 0 && <p>{data.products.low_stock} product(s) running low</p>}
            {data.products.batches_expiring_soon > 0 && (
              <p>{data.products.batches_expiring_soon} batch(es) expiring within 3 days</p>
            )}
          </div>
        </div>
      )}

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4">
        <h2 className="text-sm font-semibold text-ink-500 mb-2">This month</h2>
        <p className="text-sm text-ink-400">Credited to wallet: <span className="font-mono text-ink-500">₹{data.earnings.this_month_credited}</span></p>
      </div>
    </div>
  )
}
