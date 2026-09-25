import { useState } from 'react'
import { ImageOff } from 'lucide-react'

/**
 * Admin <img> that says "Photo missing — re-upload" instead of showing a
 * broken-image icon (e.g. files that lived on the old server disk).
 */
export function AdminImage({ src, alt = '', className = '' }: { src: string; alt?: string; className?: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  if (failedSrc === src) {
    return (
      <span
        className={`${className} flex flex-col items-center justify-center gap-0.5 bg-chili-100/60 text-chili-600 text-[10px] font-semibold text-center leading-tight`}
        title="The image file is missing — edit and upload it again"
      >
        <ImageOff className="h-4 w-4" />
        Photo missing — re-upload
      </span>
    )
  }
  return <img src={src} alt={alt} className={className} onError={() => setFailedSrc(src)} />
}
