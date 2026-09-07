import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { superAdminApi } from '@/api/superadmin'
import { cn, formatDate } from '@/lib/utils'

export function LogsPage() {
  const [pathFilter, setPathFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['logs', pathFilter, methodFilter],
    queryFn: () => superAdminApi.logs({ path_contains: pathFilter || undefined, method: methodFilter || undefined }),
  })

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-ink-500">Audit Logs</h1>
        <p className="text-sm text-ink-300">Every non-GET API call, platform-wide.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={pathFilter}
          onChange={(e) => setPathFilter(e.target.value)}
          placeholder="Filter by path (e.g. vendors)"
          className="rounded-lg border border-ink-100 px-3 py-2 text-sm w-64 outline-none focus:border-forest-400"
        />
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-forest-400"
        >
          <option value="">All methods</option>
          <option value="POST">POST</option>
          <option value="PATCH">PATCH</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs text-ink-300">
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Method</th>
              <th className="px-4 py-3 font-medium">Path</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">IP</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-300">Loading...</td>
              </tr>
            )}
            {data?.results.map((log) => (
              <tr key={log.id} className="border-b border-ink-100/60 last:border-0">
                <td className="px-4 py-3 text-xs text-ink-300 whitespace-nowrap">{formatDate(log.created_at)}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink-400">{log.user_phone || '—'}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-mono font-semibold bg-rice-100 border border-ink-100 rounded px-1.5 py-0.5">
                    {log.method}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-ink-500 truncate max-w-xs">{log.path}</td>
                <td className="px-4 py-3">
                  <span className={cn('font-mono text-xs font-semibold', log.status_code >= 400 ? 'text-chili-600' : 'text-forest-600')}>
                    {log.status_code}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-ink-300">{log.ip_address || '—'}</td>
              </tr>
            ))}
            {data && data.results.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-300">No logs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
