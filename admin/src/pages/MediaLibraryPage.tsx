import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, File as FileIcon, Search, Trash2, Upload } from 'lucide-react'
import { adminApi } from '@/api/admin'
import type { AdminMediaAsset } from '@/types'

export function MediaLibraryPage() {
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-media', search],
    queryFn: () => adminApi.mediaAssets(search || undefined),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-media'] })

  const upload = useMutation({
    mutationFn: (file: File) => adminApi.uploadMediaAsset(file, file.name.replace(/\.[^.]+$/, '')),
    onSuccess: invalidate,
  })

  const remove = useMutation({ mutationFn: adminApi.deleteMediaAsset, onSuccess: invalidate })

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    files.forEach((f) => upload.mutate(f))
    e.target.value = ''
  }

  const copyUrl = (asset: AdminMediaAsset) => {
    navigator.clipboard.writeText(asset.file)
    setCopiedId(asset.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const assets = data?.results ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-500">Media Library</h1>
        <label className="inline-flex items-center gap-1.5 rounded-xl bg-forest-600 text-rice-50 text-sm font-medium px-4 py-2.5 cursor-pointer hover:bg-forest-700">
          <Upload className="h-4 w-4" /> {upload.isPending ? 'Uploading...' : 'Upload'}
          <input type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={handleUpload} />
        </label>
      </div>
      <p className="text-xs text-ink-300 -mt-2">
        Upload once, then copy the URL to reuse in banners, blog posts, offers, etc. — no need to re-upload the same file.
      </p>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name"
          className="w-full rounded-lg border border-ink-100 bg-rice-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-forest-400"
        />
      </div>

      {isLoading && <p className="text-ink-300 animate-pulse">Loading...</p>}

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {assets.map((asset) => (
          <div key={asset.id} className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 overflow-hidden">
            <div className="h-24 bg-rice-100 flex items-center justify-center">
              {asset.is_image ? (
                <img src={asset.file} alt={asset.alt_text} className="h-full w-full object-cover" />
              ) : (
                <FileIcon className="h-8 w-8 text-ink-300" />
              )}
            </div>
            <div className="p-2">
              <p className="text-xs text-ink-400 truncate" title={asset.alt_text}>
                {asset.alt_text || 'Untitled'}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <button onClick={() => copyUrl(asset)} className="text-ink-300 hover:text-forest-600" title="Copy URL">
                  {copiedId === asset.id ? <Check className="h-3.5 w-3.5 text-forest-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => remove.mutate(asset.id)} className="text-ink-300 hover:text-chili-500" title="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {data && assets.length === 0 && (
          <p className="text-ink-300 text-center py-8 col-span-full">No media uploaded yet.</p>
        )}
      </div>
    </div>
  )
}
