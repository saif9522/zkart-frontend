import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Check, Copy, File as FileIcon, ImageDown, Search, Sparkles, Trash2, Upload } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { apiErrorMessage } from '@/api/client'
import { AdminImage } from '@/components/ui/AdminImage'
import { Pager } from '@/components/ui/Pager'
import { MatchPhotosModal } from '@/components/MatchPhotosModal'
import type { AdminMediaAsset } from '@/types'

type Show = '' | 'used' | 'unused' | 'missing'

const fmtSize = (b: number | null) => (b == null ? '' : b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)

export function MediaLibraryPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [show, setShow] = useState<Show>('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [matchOpen, setMatchOpen] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350)
    return () => clearTimeout(t)
  }, [search])
  useEffect(() => setSelected(new Set()), [debounced, show])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-media', debounced, show],
    queryFn: () => adminApi.mediaAssets(debounced || undefined, show),
    placeholderData: (prev) => prev,
  })
  const { data: summary } = useQuery({
    queryKey: ['admin-media-summary'],
    queryFn: adminApi.mediaSummary,
    refetchInterval: (q) => (q.state.data?.thumbs_job.status === 'running' ? 2000 : false),
  })
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-media'] })
    queryClient.invalidateQueries({ queryKey: ['admin-media-summary'] })
  }
  // when the preview job finishes, reload the grid once
  const jobStatus = summary?.thumbs_job.status
  useEffect(() => {
    if (jobStatus === 'done') queryClient.invalidateQueries({ queryKey: ['admin-media'] })
  }, [jobStatus, queryClient])

  const upload = useMutation({
    mutationFn: (file: File) => adminApi.uploadMediaAsset(file, file.name.replace(/\.[^.]+$/, '')),
    onSuccess: refresh,
  })
  const del = useMutation({
    mutationFn: (payload: { ids?: string[]; all_missing?: boolean }) => adminApi.bulkDeleteMedia(payload),
    onSuccess: (r) => {
      setMsg(
        `${r.removed} photo(s) library se hata di.` +
          (r.kept_in_use ? ` ${r.kept_in_use} file(s) products/sliders mein use ho rahi thi — wo waisi hi rahengi.` : '') +
          (r.files_deleted ? ` ${r.files_deleted} file(s) Hostinger se bhi delete hui (jagah khaali).` : '')
      )
      setSelected(new Set())
      refresh()
    },
    onError: (e) => setMsg(apiErrorMessage(e, 'Delete failed.')),
  })
  const thumbs = useMutation({ mutationFn: adminApi.makeMediaThumbnails, onSuccess: refresh })

  const assets = data?.results ?? []
  const allSelected = assets.length > 0 && assets.every((a) => selected.has(a.id))
  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  const confirmDelete = (ids: string[], used: number) => {
    const extra = used ? `\n\n${used} photo(s) kisi product/slider mein lagi hai — wo wahan se NAHI hategi, sirf library se.` : ''
    if (window.confirm(`${ids.length} photo(s) delete karein?${extra}`)) del.mutate({ ids })
  }
  const copyUrl = (asset: AdminMediaAsset) => {
    navigator.clipboard.writeText(asset.file)
    setCopiedId(asset.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const job = summary?.thumbs_job
  const tabs: { key: Show; label: string; n?: number }[] = [
    { key: '', label: 'All', n: summary?.total },
    { key: 'used', label: 'Used', n: summary?.used },
    { key: 'unused', label: 'Not used', n: summary?.unused },
    { key: 'missing', label: 'Missing file', n: summary?.missing },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-xl font-bold text-ink-500">Media Library</h1>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setMatchOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-forest-600 text-forest-700 text-sm font-medium px-3 py-2 hover:bg-forest-50"
          >
            <Sparkles className="h-4 w-4" /> Match photos to products
          </button>
          <label className="inline-flex items-center gap-1.5 rounded-xl bg-forest-600 text-rice-50 text-sm font-medium px-4 py-2 cursor-pointer hover:bg-forest-700">
            <Upload className="h-4 w-4" /> {upload.isPending ? 'Uploading...' : 'Upload'}
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                Array.from(e.target.files ?? []).forEach((f) => upload.mutate(f))
                e.target.value = ''
              }}
            />
          </label>
        </div>
      </div>
      <MatchPhotosModal open={matchOpen} onClose={() => { setMatchOpen(false); refresh() }} />

      {/* speed-up: previews for old photos */}
      {summary && (summary.without_thumb > 0 || job?.status === 'running') && (
        <div className="rounded-xl border border-mango-300 bg-mango-50 px-3 py-2.5 flex items-center gap-3 flex-wrap text-sm">
          <ImageDown className="h-4 w-4 text-mango-600 shrink-0" />
          {job?.status === 'running' ? (
            <>
              <span className="text-ink-500">
                Previews ban rahe hain… {job.done}/{job.total}
                {job.missing ? ` · ${job.missing} file gayab mili` : ''}
              </span>
              <div className="flex-1 min-w-[120px] h-1.5 rounded-full bg-mango-100 overflow-hidden">
                <div className="h-full bg-mango-500 transition-all" style={{ width: `${job.total ? (job.done / job.total) * 100 : 0}%` }} />
              </div>
            </>
          ) : (
            <>
              <span className="text-ink-500 flex-1">
                <b>{summary.without_thumb}</b> purani photos ka chhota preview nahi hai — isliye page slow hai. Ek baar preview bana dein
                (gayab files bhi pata chal jaayengi).
              </span>
              <button onClick={() => thumbs.mutate()} disabled={thumbs.isPending} className="rounded-lg bg-mango-500 text-ink-500 font-semibold text-xs px-3 py-1.5">
                Make previews (fast)
              </button>
            </>
          )}
        </div>
      )}

      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name"
            className="w-full rounded-lg border border-ink-100 bg-rice-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-forest-400"
          />
        </div>
        {tabs.map((t) => (
          <button
            key={t.key || 'all'}
            onClick={() => setShow(t.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold border ${
              show === t.key ? 'bg-forest-600 text-rice-50 border-forest-600' : 'bg-rice-50 text-ink-400 border-ink-100'
            }`}
          >
            {t.label}
            {t.n !== undefined ? ` (${t.n})` : ''}
          </button>
        ))}
        {isFetching && !isLoading && <span className="text-xs text-ink-300">updating…</span>}
      </div>

      {show === 'missing' && (summary?.missing ?? 0) > 0 && (
        <button
          onClick={() => window.confirm(`Saari ${summary!.missing} gayab-file wali entries hata dein?`) && del.mutate({ all_missing: true })}
          className="self-start rounded-lg bg-chili-600 text-rice-50 text-xs font-semibold px-3 py-1.5"
        >
          Delete all {summary!.missing} missing entries
        </button>
      )}

      {assets.length > 0 && (
        <div className="flex items-center gap-3 text-sm flex-wrap">
          <label className="flex items-center gap-2 text-xs text-ink-400">
            <input type="checkbox" className="accent-forest-600" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(assets.map((a) => a.id)))} />
            Select all on this page
          </label>
          {selected.size > 0 && (
            <button
              onClick={() => confirmDelete([...selected], assets.filter((a) => selected.has(a.id) && (a.used_in?.length ?? 0) > 0).length)}
              className="inline-flex items-center gap-1 rounded-lg bg-chili-600 text-rice-50 text-xs font-semibold px-3 py-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete {selected.size} selected
            </button>
          )}
        </div>
      )}
      {msg && (
        <p className="text-sm text-forest-700 bg-forest-50 rounded-lg px-3 py-2" onClick={() => setMsg('')}>
          {msg}
        </p>
      )}

      {isLoading && <p className="text-ink-300 animate-pulse">Loading...</p>}

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {assets.map((asset) => {
          const used = asset.used_in ?? []
          const isSel = selected.has(asset.id)
          return (
            <div
              key={asset.id}
              className={`relative rounded-[var(--radius-card)] bg-rice-50 border overflow-hidden ${isSel ? 'border-forest-600 ring-2 ring-forest-600/30' : 'border-ink-100/60'}`}
            >
              <input
                type="checkbox"
                checked={isSel}
                onChange={() => toggle(asset.id)}
                className="absolute top-2 left-2 z-10 h-4 w-4 accent-forest-600"
                aria-label="Select"
              />
              <div className="h-28 bg-rice-100 flex items-center justify-center" onClick={() => toggle(asset.id)}>
                {asset.is_missing ? (
                  <span className="flex flex-col items-center text-chili-600 text-[10px] font-semibold">
                    <AlertTriangle className="h-5 w-5" /> File missing
                  </span>
                ) : asset.is_image ? (
                  <AdminImage src={asset.thumb || asset.file} alt={asset.alt_text} className="h-full w-full object-cover" />
                ) : (
                  <FileIcon className="h-8 w-8 text-ink-300" />
                )}
              </div>
              <div className="p-2 flex flex-col gap-1">
                <p className="text-xs text-ink-500 font-medium truncate" title={asset.alt_text}>
                  {asset.alt_text || 'Untitled'}
                </p>
                {used.length > 0 ? (
                  <p className="text-[10px] text-forest-700 leading-snug line-clamp-2" title={used.join('\n')}>
                    ✔ {used[0]}
                    {used.length > 1 ? ` +${used.length - 1} more` : ''}
                  </p>
                ) : (
                  <p className="text-[10px] text-ink-300">Kahin use nahi ho rahi</p>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-ink-300 flex-1">{fmtSize(asset.file_size)}</span>
                  <button onClick={() => copyUrl(asset)} className="text-ink-300 hover:text-forest-600" title="Copy URL">
                    {copiedId === asset.id ? <Check className="h-3.5 w-3.5 text-forest-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => confirmDelete([asset.id], used.length ? 1 : 0)} className="text-ink-300 hover:text-chili-500" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {data && assets.length === 0 && <p className="text-ink-300 text-center py-8 col-span-full">Yahan koi photo nahi hai.</p>}
      </div>
      <Pager endpoint="/admin/media-library/" resetOn={[debounced, show]} />
    </div>
  )
}
