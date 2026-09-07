import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, Trash2 } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { Badge } from '@/components/ui/Badge'
import type { AdminContactMessage } from '@/types'

const STATUS_OPTIONS: AdminContactMessage['status'][] = ['new', 'read', 'resolved']

export function ContactMessagesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-contact-messages', search, statusFilter],
    queryFn: () => adminApi.contactMessages({ search: search || undefined, status: statusFilter || undefined }),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-contact-messages'] })

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdminContactMessage['status'] }) =>
      adminApi.setContactMessageStatus(id, status),
    onSuccess: invalidate,
  })

  const remove = useMutation({ mutationFn: adminApi.deleteContactMessage, onSuccess: invalidate })

  const messages = data?.results ?? []

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-ink-500">Contact Messages</h1>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, subject"
            className="w-full rounded-lg border border-ink-100 bg-rice-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-forest-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-ink-100 bg-rice-50 px-3 py-2 text-sm outline-none focus:border-forest-400"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-ink-300 animate-pulse">Loading...</p>}

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 divide-y divide-ink-100/60">
        {messages.map((msg) => (
          <div key={msg.id} className="p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ink-500 text-sm">{msg.subject}</p>
                <p className="text-xs text-ink-300">
                  {msg.name} · {msg.email} {msg.phone && `· ${msg.phone}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={msg.status}
                  onChange={(e) => setStatus.mutate({ id: msg.id, status: e.target.value as AdminContactMessage['status'] })}
                  className="text-xs rounded-lg border border-ink-100 px-2 py-1 outline-none"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <Badge status={msg.status === 'resolved' ? 'active' : msg.status === 'new' ? 'pending' : 'inactive'} label={msg.status} />
                <button onClick={() => remove.mutate(msg.id)} className="text-ink-300 hover:text-chili-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-ink-400 mt-2">{msg.message}</p>
            <p className="text-xs text-ink-300 mt-1">{new Date(msg.created_at).toLocaleString()}</p>
          </div>
        ))}
        {data && messages.length === 0 && <p className="text-ink-300 text-center py-8">No messages.</p>}
      </div>
    </div>
  )
}
