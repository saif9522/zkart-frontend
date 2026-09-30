import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, FileText, X, ZoomIn, ZoomOut } from 'lucide-react'
import { api } from '@/api/client'

export interface DocumentItem {
  key: string
  label: string
  src: string
}

export function DocumentLightbox({
  documents,
  startIndex,
  onClose,
}: {
  documents: DocumentItem[]
  startIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(startIndex)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [isPdf, setIsPdf] = useState(false)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [zoomed, setZoomed] = useState(false)

  const current = documents[index]

  useEffect(() => {
    let currentBlobUrl: string | null = null
    let cancelled = false
    setLoading(true)
    setFailed(false)
    setZoomed(false)

    api
      .get(current.src, { responseType: 'blob' })
      .then((res) => {
        if (cancelled) return
        const blob = res.data as Blob
        currentBlobUrl = URL.createObjectURL(blob)
        setIsPdf(blob.type === 'application/pdf')
        setObjectUrl(currentBlobUrl)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
      if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl)
    }
  }, [current.src])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(documents.length - 1, i + 1))
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [documents.length, onClose])

  return (
    <div className="fixed inset-0 z-50 bg-ink-500/90 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 text-rice-50">
        <div>
          <p className="text-sm font-semibold">{current.label}</p>
          <p className="text-xs text-rice-100/60">{index + 1} of {documents.length}</p>
        </div>
        <div className="flex items-center gap-3">
          {objectUrl && !isPdf && (
            <button onClick={() => setZoomed((z) => !z)} className="hover:text-mango-500" title="Zoom">
              {zoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
            </button>
          )}
          {objectUrl && (
            <a href={objectUrl} download={current.label} className="hover:text-mango-500" title="Download">
              <Download className="h-5 w-5" />
            </a>
          )}
          <button onClick={onClose} className="hover:text-chili-400" title="Close (Esc)">
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative px-12 pb-6 overflow-hidden">
        {documents.length > 1 && (
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-rice-50/10 text-rice-50 flex items-center justify-center hover:bg-rice-50/20 disabled:opacity-30"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {loading && <div className="h-10 w-10 rounded-full border-2 border-rice-50/30 border-t-rice-50 animate-spin" />}
        {failed && (
          <div className="text-rice-100 text-sm flex flex-col items-center gap-2">
            <FileText className="h-10 w-10" />
            Couldn't load this document.
          </div>
        )}
        {!loading && !failed && objectUrl && isPdf && (
          <iframe src={objectUrl} title={current.label} className="w-full h-full max-w-4xl bg-rice-50 rounded-lg" />
        )}
        {!loading && !failed && objectUrl && !isPdf && (
          <img
            src={objectUrl}
            alt={current.label}
            onClick={() => setZoomed((z) => !z)}
            className={`rounded-lg cursor-zoom-in transition-transform ${zoomed ? 'max-w-none scale-150 cursor-zoom-out' : 'max-h-full max-w-full object-contain'}`}
          />
        )}

        {documents.length > 1 && (
          <button
            onClick={() => setIndex((i) => Math.min(documents.length - 1, i + 1))}
            disabled={index === documents.length - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-rice-50/10 text-rice-50 flex items-center justify-center hover:bg-rice-50/20 disabled:opacity-30"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {documents.length > 1 && (
        <div className="flex items-center gap-2 justify-center pb-4 overflow-x-auto px-4">
          {documents.map((d, i) => (
            <button
              key={d.key}
              onClick={() => setIndex(i)}
              className={`shrink-0 h-2 w-2 rounded-full ${i === index ? 'bg-rice-50' : 'bg-rice-50/30'}`}
              title={d.label}
            />
          ))}
        </div>
      )}
    </div>
  )
}
