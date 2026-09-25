import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { adminApi } from '@/api/admin'

/**
 * Red banner on every admin page while uploaded photos would NOT survive
 * (temporary server disk) or the storage setup is broken — so nobody has to
 * discover it by photos silently disappearing.
 */
export function StorageWarning() {
  const queryClient = useQueryClient()
  const [checking, setChecking] = useState(false)
  const { data } = useQuery({
    queryKey: ['storage-status'],
    queryFn: () => adminApi.storageStatus(),
    staleTime: 10 * 60 * 1000,
    retry: false,
  })
  if (!data || data.ok) return null

  const recheck = async () => {
    setChecking(true)
    try {
      queryClient.setQueryData(['storage-status'], await adminApi.storageStatus(true))
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="bg-chili-100 border-b border-chili-500/30 px-4 py-2.5 text-sm text-chili-600 flex items-start gap-2">
      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold">{data.message}</p>
        {data.fix && <p className="text-xs mt-0.5 text-ink-500">👉 {data.fix}</p>}
      </div>
      <button onClick={recheck} disabled={checking} className="shrink-0 flex items-center gap-1 text-xs font-semibold underline disabled:opacity-50">
        <RefreshCw className={`h-3.5 w-3.5 ${checking ? 'animate-spin' : ''}`} /> Re-check
      </button>
    </div>
  )
}
