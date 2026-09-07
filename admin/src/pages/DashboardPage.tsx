import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Building2, IndianRupee, Package, Truck, Users } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { StatCard } from '@/components/ui/StatCard'
import { formatINR } from '@/lib/utils'

export function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: adminApi.dashboard })

  if (isLoading || !data) {
    return <div className="text-ink-300 animate-pulse">Loading dashboard...</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-ink-500">Dashboard</h1>
        <p className="text-sm text-ink-300">Platform overview, updated live</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total users" value={data.users.total} icon={Users} />
        <StatCard
          label="Vendors"
          value={data.vendors.total}
          icon={Building2}
          accent="mango"
          sub={data.vendors.pending_approval > 0 ? `${data.vendors.pending_approval} pending approval` : undefined}
        />
        <StatCard
          label="Delivery partners"
          value={data.delivery_partners.total}
          icon={Truck}
          sub={data.delivery_partners.pending_approval > 0 ? `${data.delivery_partners.pending_approval} pending approval` : undefined}
        />
        <StatCard label="Orders today" value={data.orders.today} icon={Package} accent="mango" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Revenue this month" value={formatINR(data.revenue_this_month)} icon={IndianRupee} accent="forest" />
        <StatCard label="Delivered this month" value={data.orders.delivered_this_month} icon={Package} />
        <StatCard
          label="Cancelled this month"
          value={data.orders.cancelled_this_month}
          icon={AlertTriangle}
          accent="chili"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatCard label="Low stock products" value={data.low_stock_products} icon={AlertTriangle} accent="mango" />
        <StatCard label="Out of stock products" value={data.out_of_stock_products} icon={AlertTriangle} accent="chili" />
      </div>

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4">
        <h2 className="text-sm font-semibold text-ink-500 mb-3">Users by role</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.users.by_role).map(([role, count]) => (
            <span key={role} className="text-xs font-medium bg-rice-100 border border-ink-100 rounded-full px-3 py-1.5 capitalize">
              {role.replace('_', ' ')}: <span className="font-mono font-semibold">{count}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
