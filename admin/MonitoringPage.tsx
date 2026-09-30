import { useQuery } from '@tanstack/react-query'
import { Activity, AlertCircle, TrendingUp } from 'lucide-react'
import { superAdminApi } from '@/api/superadmin'
import { StatCard } from '@/components/ui/StatCard'

export function MonitoringPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['monitoring'],
    queryFn: superAdminApi.monitoring,
    refetchInterval: 15000,
  })

  if (isLoading || !data) return <p className="text-ink-300 animate-pulse">Loading...</p>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-ink-500">API Monitoring</h1>
        <p className="text-sm text-ink-300">Last 24 hours, built from the audit log. Refreshes every 15s.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <StatCard label="Total requests (24h)" value={data.total_requests} icon={Activity} />
        <StatCard label="Errors (24h)" value={data.error_count} icon={AlertCircle} accent="chili" />
        <StatCard label="Error rate" value={`${data.error_rate_percent}%`} icon={TrendingUp} accent="mango" />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4">
          <h2 className="text-sm font-semibold text-ink-500 mb-3">Top endpoints</h2>
          <div className="flex flex-col gap-2">
            {data.top_endpoints.map((e) => (
              <div key={e.path} className="flex items-center justify-between text-xs">
                <span className="font-mono text-ink-400 truncate max-w-[70%]">{e.path}</span>
                <span className="font-mono font-semibold text-ink-500">{e.count}</span>
              </div>
            ))}
            {data.top_endpoints.length === 0 && <p className="text-xs text-ink-300">No traffic yet.</p>}
          </div>
        </div>

        <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4">
          <h2 className="text-sm font-semibold text-ink-500 mb-3">Status code breakdown</h2>
          <div className="flex flex-col gap-2">
            {Object.entries(data.status_code_breakdown).map(([code, count]) => (
              <div key={code} className="flex items-center justify-between text-xs">
                <span className={`font-mono font-semibold ${Number(code) >= 400 ? 'text-chili-600' : 'text-forest-600'}`}>
                  {code}
                </span>
                <span className="font-mono text-ink-500">{count}</span>
              </div>
            ))}
            {Object.keys(data.status_code_breakdown).length === 0 && <p className="text-xs text-ink-300">No traffic yet.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
