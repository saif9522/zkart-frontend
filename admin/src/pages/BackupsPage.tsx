import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DatabaseBackup } from 'lucide-react'
import { superAdminApi } from '@/api/superadmin'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { apiErrorMessage } from '@/api/client'
import { formatDate } from '@/lib/utils'
import { useState } from 'react'

function formatBytes(bytes: number | null) {
  if (!bytes) return '—'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function BackupsPage() {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const { data, isLoading } = useQuery({ queryKey: ['backups'], queryFn: superAdminApi.backups, refetchInterval: 5000 })

  const trigger = useMutation({
    mutationFn: superAdminApi.triggerBackup,
    onSuccess: () => {
      setError('')
      queryClient.invalidateQueries({ queryKey: ['backups'] })
    },
    onError: (err) => setError(apiErrorMessage(err, 'Could not start backup.')),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-500">Database Backups</h1>
          <p className="text-sm text-ink-300">Runs in the background via Celery — copies SQLite or pg_dumps Postgres.</p>
        </div>
        <Button size="sm" onClick={() => trigger.mutate()} loading={trigger.isPending}>
          <DatabaseBackup className="h-4 w-4" /> Trigger backup
        </Button>
      </div>

      {error && (
        <p className="text-sm text-chili-600 bg-chili-100 rounded-lg px-3 py-2">{error}</p>
      )}

      {isLoading && <p className="text-ink-300 animate-pulse">Loading...</p>}

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs text-ink-300">
              <th className="px-4 py-3 font-medium">Filename</th>
              <th className="px-4 py-3 font-medium">Size</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Started</th>
              <th className="px-4 py-3 font-medium">Finished</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((log) => (
              <tr key={log.id} className="border-b border-ink-100/60 last:border-0">
                <td className="px-4 py-3 font-mono text-xs text-ink-500">{log.filename || '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink-400">{formatBytes(log.size_bytes)}</td>
                <td className="px-4 py-3">
                  <Badge status={log.status} />
                  {log.error_message && <p className="text-xs text-chili-600 mt-1 max-w-xs">{log.error_message}</p>}
                </td>
                <td className="px-4 py-3 text-xs text-ink-300">{formatDate(log.started_at)}</td>
                <td className="px-4 py-3 text-xs text-ink-300">{log.finished_at ? formatDate(log.finished_at) : '—'}</td>
              </tr>
            ))}
            {data && data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-300">No backups yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
