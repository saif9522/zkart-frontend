import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, FileUp, FlaskConical, Loader2, UploadCloud, XCircle } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { apiErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'

/**
 * Bring the old products into the live (Supabase) database straight from the
 * admin panel — pick products_import.db, do a test run, then import.
 */
export function ImportProductsPage() {
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [useExisting, setUseExisting] = useState(true)
  const [assignTo, setAssignTo] = useState('')
  const [error, setError] = useState('')

  const { data: job } = useQuery({
    queryKey: ['import-job'],
    queryFn: adminApi.importStatus,
    refetchInterval: (q) => (q.state.data?.status === 'running' ? 2000 : false),
  })

  const start = useMutation({
    mutationFn: (dryRun: boolean) =>
      adminApi.startImport(file!, { dryRun, useExistingAccounts: useExisting, assignTo }),
    onMutate: () => setError(''),
    onSuccess: (data) => queryClient.setQueryData(['import-job'], data),
    onError: (err) => setError(apiErrorMessage(err, 'Could not start the import.')),
  })

  const running = job?.status === 'running'
  const summary = (job?.log ?? '')
    .split('\n')
    .filter((l) => /created|reused|skipped|attached|assigned|Shortened|Blanked/.test(l))
    .map((l) => l.trim())

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-ink-500 flex items-center gap-2">
          <UploadCloud className="h-5 w-5 text-forest-600" /> Import old products
        </h1>
        <p className="text-sm text-ink-400 mt-1">
          Brings the old store's products, categories and shops into the live database. Your current users, orders and
          products are never changed — anything already here is skipped, so it's safe to run again.
        </p>
      </div>

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink-400">1. Choose the file (products_import.db)</span>
          <label className="flex items-center gap-2 rounded-lg border border-dashed border-ink-100 px-3 py-3 text-sm text-ink-400 cursor-pointer hover:border-forest-400">
            <FileUp className="h-4 w-4" />
            {file ? `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)` : 'Click to choose file'}
            <input type="file" accept=".db,.sqlite,.sqlite3" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-ink-400">2. Shops</span>
          <label className="flex items-start gap-2 text-sm text-ink-500">
            <input type="checkbox" checked={useExisting} onChange={(e) => setUseExisting(e.target.checked)} className="mt-1 accent-forest-600" disabled={!!assignTo.trim()} />
            <span>
              If an old shop owner's phone already signed up here as a customer, make that account the shop owner
              <span className="block text-xs text-ink-300">(e.g. Ariba Mart → +919471500119). Their current password stays.</span>
            </span>
          </label>
          <Field
            label="OR put ALL products under one existing shop — owner's phone (optional)"
            placeholder="+91XXXXXXXXXX"
            value={assignTo}
            onChange={(e) => setAssignTo(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-chili-600">{error}</p>}

        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" disabled={!file || running} loading={start.isPending && start.variables === true} onClick={() => start.mutate(true)}>
            <FlaskConical className="h-4 w-4" /> 3. Test run (nothing saved)
          </Button>
          <Button
            disabled={!file || running}
            loading={start.isPending && start.variables === false}
            onClick={() => window.confirm('Import the products into the live store now?') && start.mutate(false)}
          >
            <UploadCloud className="h-4 w-4" /> 4. Import now
          </Button>
        </div>
      </div>

      {job && job.status !== 'idle' && (
        <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 font-semibold text-ink-500">
            {running && <Loader2 className="h-5 w-5 animate-spin text-forest-600" />}
            {job.status === 'done' && <CheckCircle2 className="h-5 w-5 text-forest-600" />}
            {job.status === 'failed' && <XCircle className="h-5 w-5 text-chili-600" />}
            {running
              ? `${job.dry_run ? 'Test run' : 'Import'} in progress… (usually under a minute)`
              : job.status === 'done'
                ? job.dry_run
                  ? 'Test run finished — nothing was saved. Looks good? Click "Import now".'
                  : 'Import finished — products are live!'
                : 'Import failed — nothing was saved. See the details below.'}
          </div>
          {summary.length > 0 && (
            <ul className="text-sm text-ink-500 grid sm:grid-cols-2 gap-x-6 gap-y-1">
              {summary.map((l, i) => (
                <li key={i} className="flex justify-between gap-3 border-b border-ink-100/60 py-0.5">
                  <span className="text-ink-400">{l.replace(/\s+\d+$/, '')}</span>
                  <span className="font-mono font-semibold">{l.match(/(\d+)$/)?.[1] ?? ''}</span>
                </li>
              ))}
            </ul>
          )}
          <details open={job.status === 'failed'}>
            <summary className="text-xs text-ink-300 cursor-pointer">Full log</summary>
            <pre className="mt-2 text-[11px] leading-relaxed bg-ink-500 text-rice-50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{job.log}</pre>
          </details>
        </div>
      )}
    </div>
  )
}
