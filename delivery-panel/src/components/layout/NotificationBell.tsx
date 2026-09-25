import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { api } from '@/api/client'

interface NotificationItem {
  id: string
  type: string
  title: string
  body: string
  data: Record<string, unknown> | null
  is_read: boolean
  created_at: string
}

const POLL_INTERVAL = 15000

/** Short two-tone beep via the Web Audio API — no audio file to bundle or fail to load. */
const RING_REPEATS = 7
const RING_GAP = 0.55 // seconds between each ring repeat

function playRingtone() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioContextClass()
    const now = ctx.currentTime

    for (let i = 0; i < RING_REPEATS; i++) {
      const base = now + i * RING_GAP
      ;[[880, base, 0.15], [660, base + 0.15, 0.18]].forEach(([freq, start, duration]) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = freq as number
        gain.gain.setValueAtTime(0.001, start as number)
        gain.gain.exponentialRampToValueAtTime(0.25, (start as number) + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.001, (start as number) + (duration as number))
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(start as number)
        osc.stop((start as number) + (duration as number) + 0.02)
      })
    }
    setTimeout(() => ctx.close(), (RING_REPEATS * RING_GAP + 1) * 1000)
  } catch {
    // Some browsers block audio before any user interaction — silently skip, badge count still updates.
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const previousCount = useRef<number | null>(null)
  const queryClient = useQueryClient()

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => api.get<{ unread_count: number }>('/notifications/unread_count/').then((r) => r.data),
    refetchInterval: POLL_INTERVAL,
  })

  const { data: listData } = useQuery({
    queryKey: ['notifications-list'],
    queryFn: () => api.get<{ results: NotificationItem[] }>('/notifications/').then((r) => r.data),
    refetchInterval: open ? POLL_INTERVAL : false,
    enabled: open,
  })

  const unreadCount = unreadData?.unread_count ?? 0

  useEffect(() => {
    if (previousCount.current !== null && unreadCount > previousCount.current) {
      playRingtone()
    }
    previousCount.current = unreadCount
  }, [unreadCount])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    queryClient.invalidateQueries({ queryKey: ['notifications-list'] })
  }

  const markRead = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read/`),
    onSuccess: invalidate,
  })

  const markAllRead = useMutation({
    mutationFn: () => api.post('/notifications/mark-all-read/'),
    onSuccess: invalidate,
  })

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative h-9 w-9 rounded-full flex items-center justify-center text-ink-400 hover:bg-rice-100"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 h-4 min-w-4 px-1 rounded-full bg-chili-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl bg-rice-50 border border-ink-100 shadow-lg z-50">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-ink-100">
            <span className="text-sm font-semibold text-ink-500">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-xs text-forest-600 hover:text-forest-700"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="divide-y divide-ink-100/60">
            {(listData?.results ?? []).map((n) => (
              <button
                key={n.id}
                onClick={() => !n.is_read && markRead.mutate(n.id)}
                className={`w-full text-left px-3 py-2.5 hover:bg-rice-100 transition-colors ${!n.is_read ? 'bg-forest-50/50' : ''}`}
              >
                <div className="flex items-start gap-2">
                  {!n.is_read && <span className="h-1.5 w-1.5 rounded-full bg-forest-600 mt-1.5 shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-500 truncate">{n.title}</p>
                    <p className="text-xs text-ink-300 truncate">{n.body}</p>
                    <p className="text-[10px] text-ink-200 mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </button>
            ))}
            {listData && listData.results.length === 0 && (
              <p className="text-sm text-ink-300 text-center py-8">No notifications yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
