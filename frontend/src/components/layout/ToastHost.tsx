import { useToastStore } from '@/store/toast'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'

export function ToastHost() {
  const { toasts, dismiss } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg',
            t.variant === 'error' ? 'bg-chili-500 text-rice-50' : 'bg-forest-600 text-rice-50'
          )}
        >
          {t.variant === 'error' ? (
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          )}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-80 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
