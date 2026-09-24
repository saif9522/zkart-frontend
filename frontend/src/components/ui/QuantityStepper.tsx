import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuantityStepperProps {
  quantity: number
  onIncrease: () => void
  onDecrease: () => void
  disabled?: boolean
  size?: 'sm' | 'md'
}

export function QuantityStepper({ quantity, onIncrease, onDecrease, disabled, size = 'md' }: QuantityStepperProps) {
  const isSm = size === 'sm'
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg bg-forest-600 text-rice-50 overflow-hidden',
        isSm ? 'h-7' : 'h-9'
      )}
    >
      <button
        type="button"
        onClick={onDecrease}
        disabled={disabled}
        aria-label="Decrease quantity"
        className={cn('flex items-center justify-center hover:bg-forest-700 disabled:opacity-50', isSm ? 'w-7' : 'w-9')}
      >
        <Minus className={isSm ? 'h-3 w-3' : 'h-4 w-4'} />
      </button>
      <span className={cn('font-mono tabular-nums font-semibold', isSm ? 'w-6 text-xs' : 'w-8 text-sm', 'text-center')}>
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled}
        aria-label="Increase quantity"
        className={cn('flex items-center justify-center hover:bg-forest-700 disabled:opacity-50', isSm ? 'w-7' : 'w-9')}
      >
        <Plus className={isSm ? 'h-3 w-3' : 'h-4 w-4'} />
      </button>
    </div>
  )
}
