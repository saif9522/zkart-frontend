import { useState } from 'react'
import { ShoppingBasket } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * <img> that falls back to the basket icon when the photo is missing or fails
 * to load (e.g. product imported before its photo file was uploaded to
 * Supabase Storage) — never a broken-image icon.
 */
export function SafeImage({
  src,
  alt = '',
  className,
  iconClassName = 'h-6 w-6 text-forest-400/40',
}: {
  src?: string | null
  alt?: string
  className?: string
  iconClassName?: string
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  if (!src || failedSrc === src) return <ShoppingBasket className={iconClassName} aria-hidden="true" />
  return <img src={src} alt={alt} loading="lazy" className={cn('h-full w-full object-cover', className)} onError={() => setFailedSrc(src)} />
}
