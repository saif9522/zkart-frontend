import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export function PasswordField({ label, className, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  const input = (
    <div className="relative">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={
          className ??
          'w-full rounded-xl border border-ink-100 bg-rice-100 px-3 py-2.5 pr-10 text-sm outline-none focus:bg-rice-50 focus:border-forest-400 transition-colors'
        }
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )

  if (!label) return input

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-ink-400">{label}</span>
      {input}
    </label>
  )
}
