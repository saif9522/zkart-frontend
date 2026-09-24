import { BellRing } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

/** One-tap "turn on phone alerts" card. Hides itself once enabled. */
export function PushPrompt({ who }: { who: 'shop' | 'rider' }) {
  const { status, loading, subscribe } = usePushNotifications()
  if (status === 'subscribed' || status === 'unsupported' || status === 'not-configured') return null

  const text =
    who === 'shop'
      ? 'Get a phone alert for every new order — even when this app is closed.'
      : 'Get a phone alert when a new delivery is ready — even when this app is closed.'

  return (
    <div className="rounded-[var(--radius-card)] bg-forest-50 border border-forest-100 p-4 flex items-center gap-3">
      <BellRing className="h-6 w-6 text-forest-600 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-ink-500">Turn on order notifications</p>
        <p className="text-xs text-ink-400">
          {status === 'denied'
            ? 'Notifications are blocked. Allow them from your browser / phone settings for this site.'
            : text}
        </p>
      </div>
      {status !== 'denied' && (
        <button
          onClick={subscribe}
          disabled={loading}
          className="shrink-0 rounded-lg bg-forest-600 text-rice-50 text-sm font-semibold px-3 py-2 disabled:opacity-50"
        >
          {loading ? '...' : 'Turn on'}
        </button>
      )}
    </div>
  )
}
