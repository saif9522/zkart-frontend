import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  accent?: 'forest' | 'mango' | 'chili'
  sub?: string
}

const accents = {
  forest: 'bg-forest-50 text-forest-600',
  mango: 'bg-mango-100 text-mango-600',
  chili: 'bg-chili-100 text-chili-600',
}

export function StatCard({ label, value, icon: Icon, accent = 'forest', sub }: StatCardProps) {
  return (
    <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4 flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-ink-300">{label}</p>
        <p className="font-mono text-2xl font-bold text-ink-500 mt-1">{value}</p>
        {sub && <p className="text-xs text-ink-300 mt-1">{sub}</p>}
      </div>
      <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', accents[accent])}>
        <Icon className="h-4.5 w-4.5" />
      </div>
    </div>
  )
}
