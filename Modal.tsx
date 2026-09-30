import { type ReactNode } from 'react'
import { X } from 'lucide-react'

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-ink-500/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-[var(--radius-card)] bg-rice-50 shadow-xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto overscroll-contain">
        <div className="sticky top-0 z-10 bg-rice-50 flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-ink-100">
          <h2 className="font-semibold text-ink-500">{title}</h2>
          <button onClick={onClose} className="text-ink-300 hover:text-ink-500 p-1" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 sm:p-5 pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  )
}
