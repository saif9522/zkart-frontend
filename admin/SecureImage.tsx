import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import { api } from '@/api/client'

export function SecureImage({
  src,
  alt,
  className,
  onClick,
}: {
  src: string
  alt: string
  className?: string
  onClick?: () => void
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [isPdf, setIsPdf] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let currentUrl: string | null = null
    let cancelled = false

    api
      .get(src, { responseType: 'blob' })
      .then((res) => {
        if (cancelled) return
        const blob = res.data as Blob
        currentUrl = URL.createObjectURL(blob)
        setIsPdf(blob.type === 'application/pdf')
        setObjectUrl(currentUrl)
      })
      .catch(() => !cancelled && setFailed(true))

    return () => {
      cancelled = true
      if (currentUrl) URL.revokeObjectURL(currentUrl)
    }
  }, [src])

  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-rice-100 text-ink-300 ${className}`}>
        <FileText className="h-5 w-5" />
      </div>
    )
  }

  if (!objectUrl) {
    return <div className={`bg-rice-100 animate-pulse ${className}`} />
  }

  if (isPdf) {
    return (
      <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center gap-1 bg-rice-100 text-ink-400 hover:text-forest-600 ${className}`}
      >
        <FileText className="h-5 w-5" />
        <span className="text-[9px] font-medium">View PDF</span>
      </button>
    )
  }

  return (
    <button onClick={onClick} className="block w-full">
      <img src={objectUrl} alt={alt} className={className} />
    </button>
  )
}
