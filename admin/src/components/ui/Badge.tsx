import { cn } from '@/lib/utils'

const COLORS: Record<string, string> = {
  pending: 'bg-mango-100 text-mango-600',
  approved: 'bg-forest-100 text-forest-700',
  suspended: 'bg-chili-100 text-chili-600',
  active: 'bg-forest-100 text-forest-700',
  inactive: 'bg-ink-100 text-ink-400',
  success: 'bg-forest-100 text-forest-700',
  failed: 'bg-chili-100 text-chili-600',
  running: 'bg-mango-100 text-mango-600',
  delivered: 'bg-forest-600 text-rice-50',
  cancelled: 'bg-chili-100 text-chili-600',
  placed: 'bg-mango-100 text-mango-700',
}

export function Badge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize', COLORS[status] || 'bg-ink-100 text-ink-400')}>
      {(label ?? status).replace(/_/g, ' ')}
    </span>
  )
}
