import { type InputHTMLAttributes } from 'react'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function Field({ label, ...props }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-ink-400">{label}</span>
      <input
        {...props}
        className="rounded-lg border border-ink-100 bg-rice-100 px-3 py-2 text-sm outline-none focus:bg-rice-50 focus:border-forest-400 transition-colors"
      />
    </label>
  )
}
