import { cn } from '@/lib/utils'

interface EtaPillProps {
  minutes?: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function EtaPill({ minutes = 12, label, size = 'md', className }: EtaPillProps) {
  const sizes = {
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3.5 py-1.5 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-[var(--radius-pill)] bg-forest-600 text-rice-50 font-medium',
        sizes[size],
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-mango-500 animate-pulse-dot" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-mango-500" />
      </span>
      <span className="font-mono tabular-nums">{minutes} min</span>
      {label && <span className="text-rice-100/80 font-body font-normal">{label}</span>}
    </div>
  )
}
