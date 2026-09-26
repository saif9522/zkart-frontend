import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Download, FileSpreadsheet, Upload } from 'lucide-react'
import { vendorApi } from '@/api/vendor'
import { apiErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

/** Add / update many products at once from an Excel CSV file. */
export function BulkUploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  const upload = useMutation({
    mutationFn: () => vendorApi.importProductsCsv(file!),
    onMutate: () => setError(''),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor-products'] }),
    onError: (err) => setError(apiErrorMessage(err, 'Upload failed.')),
  })
  const result = upload.data

  const close = () => {
    setFile(null)
    setError('')
    upload.reset()
    onClose()
  }

  return (
    <Modal open={open} onClose={close} title="Bulk upload products">
      <div className="flex flex-col gap-4 text-sm">
        <ol className="flex flex-col gap-3">
          <li className="flex gap-2">
            <span className="h-6 w-6 shrink-0 rounded-full bg-forest-50 text-forest-700 text-xs font-bold flex items-center justify-center">1</span>
            <div>
              <p className="text-ink-500 font-medium">Template download karein</p>
              <button
                onClick={async () => {
                  setDownloading(true)
                  try {
                    await vendorApi.downloadProductsTemplate()
                  } catch (err) {
                    setError(apiErrorMessage(err, 'Could not download the template.'))
                  } finally {
                    setDownloading(false)
                  }
                }}
                className="mt-1 inline-flex items-center gap-1.5 text-forest-700 font-semibold text-xs"
              >
                <Download className="h-3.5 w-3.5" /> {downloading ? 'Downloading…' : 'zkart-products-template.csv'}
              </button>
            </div>
          </li>
          <li className="flex gap-2">
            <span className="h-6 w-6 shrink-0 rounded-full bg-forest-50 text-forest-700 text-xs font-bold flex items-center justify-center">2</span>
            <div>
              <p className="text-ink-500 font-medium">Excel mein products bharein, "CSV UTF-8" mein save karein</p>
              <p className="text-xs text-ink-300 mt-0.5">
                Zaroori: <b>name, category, mrp, selling_price</b>. Category ka naam wahi likhein jo site pe hai. Same <b>sku</b> dobara
                daalne se wo product <b>update</b> hoga, naya nahi banega. Ek baar mein 1000 tak products.
              </p>
            </div>
          </li>
          <li className="flex gap-2">
            <span className="h-6 w-6 shrink-0 rounded-full bg-forest-50 text-forest-700 text-xs font-bold flex items-center justify-center">3</span>
            <div className="flex-1">
              <p className="text-ink-500 font-medium">File chunein aur upload karein</p>
              <label className="mt-1.5 flex items-center gap-2 rounded-lg border border-dashed border-ink-100 px-3 py-3 text-ink-400 cursor-pointer hover:border-forest-400">
                <FileSpreadsheet className="h-4 w-4" />
                {file ? file.name : 'Choose .csv file'}
                <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] ?? null); upload.reset() }} />
              </label>
            </div>
          </li>
        </ol>

        {error && <p className="text-xs text-chili-600">{error}</p>}

        {result && (
          <div className="rounded-xl bg-forest-50 border border-forest-100 p-3">
            <p className="flex items-center gap-1.5 font-semibold text-ink-500">
              <CheckCircle2 className="h-4 w-4 text-forest-600" /> {result.created} new · {result.updated} updated
              {result.skipped > 0 && <span className="text-chili-600"> · {result.skipped} skipped</span>}
            </p>
            {result.errors.length > 0 && (
              <ul className="mt-2 max-h-40 overflow-y-auto text-xs text-chili-600 list-disc pl-4">
                {result.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
            <p className="text-[11px] text-ink-400 mt-2">Photos: har product ke "Images" mein ek saath kai photos chun sakte hain.</p>
          </div>
        )}

        <Button onClick={() => upload.mutate()} disabled={!file} loading={upload.isPending}>
          <Upload className="h-4 w-4" /> Upload products
        </Button>
      </div>
    </Modal>
  )
}
