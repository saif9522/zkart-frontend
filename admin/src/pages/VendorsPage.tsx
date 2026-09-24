import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SecureImage } from '@/components/ui/SecureImage'
import { DocumentLightbox } from '@/components/ui/DocumentLightbox'
import type { AdminVendor } from '@/types'

const STATUS_TABS = ['all', 'pending', 'approved', 'suspended'] as const

const DOC_LABELS: Record<string, string> = {
  gst_certificate: 'GST Certificate', pan_card: 'PAN Card', aadhaar_card: 'Aadhaar Card',
  shop_document: 'Shop License', business_registration_document: 'Business Registration',
  fssai_license_document: 'FSSAI License', cancelled_cheque: 'Cancelled Cheque',
  shop_front_photo: 'Shop Front', shop_interior_photo: 'Shop Interior', owner_photo: 'Owner Photo',
}

const VERIFICATION_COLOR: Record<string, 'pending' | 'active' | 'failed' | 'approved'> = {
  documents_submitted: 'pending', under_review: 'pending', approved: 'active',
  rejected: 'failed', resubmission_required: 'approved',
}

export function VendorsPage() {
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]>('all')
  const [editingCommission, setEditingCommission] = useState<string | null>(null)
  const [commissionValue, setCommissionValue] = useState('')
  const [viewing, setViewing] = useState<AdminVendor | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [actionMode, setActionMode] = useState<'reject' | 'resubmission' | null>(null)
  const [actionNotes, setActionNotes] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['vendors', status],
    queryFn: () => adminApi.vendors(status === 'all' ? {} : { status }),
  })
  const { data: history } = useQuery({
    queryKey: ['vendor-verification-history', viewing?.id],
    queryFn: () => adminApi.vendorVerificationHistory(viewing!.id),
    enabled: !!viewing,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['vendors'] })
  const refreshViewing = async () => {
    if (viewing) setViewing(await adminApi.vendor(viewing.id))
    queryClient.invalidateQueries({ queryKey: ['vendor-verification-history'] })
  }

  const approve = useMutation({
    mutationFn: (id: string) => adminApi.approveVendor(id),
    onSuccess: () => { invalidate(); refreshViewing() },
  })
  const markUnderReview = useMutation({
    mutationFn: (id: string) => adminApi.markVendorUnderReview(id),
    onSuccess: () => { invalidate(); refreshViewing() },
  })
  const suspend = useMutation({ mutationFn: adminApi.suspendVendor, onSuccess: invalidate })
  const reject = useMutation({
    mutationFn: () => adminApi.rejectVendor(viewing!.id, actionNotes),
    onSuccess: () => { invalidate(); refreshViewing(); setActionMode(null); setActionNotes('') },
  })
  const requestResubmission = useMutation({
    mutationFn: () => adminApi.requestVendorResubmission(viewing!.id, actionNotes),
    onSuccess: () => { invalidate(); refreshViewing(); setActionMode(null); setActionNotes('') },
  })
  const setCommission = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string }) => adminApi.setVendorCommission(id, value),
    onSuccess: () => { invalidate(); setEditingCommission(null) },
  })

  const startEditCommission = (v: AdminVendor) => {
    setEditingCommission(v.id)
    setCommissionValue(v.commission_percent)
  }

  const openView = async (v: AdminVendor) => {
    setActionMode(null)
    setActionNotes('')
    setViewing(await adminApi.vendor(v.id))
  }

  const documents = viewing
    ? Object.entries(DOC_LABELS).filter(([key]) => viewing[key as keyof AdminVendor])
    : []

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-ink-500">Vendors</h1>

      <div className="flex gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatus(tab)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize ${
              status === tab ? 'bg-forest-600 text-rice-50' : 'bg-rice-50 border border-ink-100 text-ink-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs text-ink-300">
              <th className="px-4 py-3 font-medium">Shop</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Commission</th>
              <th className="px-4 py-3 font-medium">Verification</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-ink-300">Loading...</td></tr>
            )}
            {data?.results.map((v) => (
              <tr key={v.id} className="border-b border-ink-100/60 last:border-0">
                <td className="px-4 py-3 font-medium text-ink-500">{v.shop_name}</td>
                <td className="px-4 py-3 text-ink-400">
                  <div>{v.owner_name}</div>
                  <div className="text-xs font-mono text-ink-300">{v.owner_phone}</div>
                </td>
                <td className="px-4 py-3 text-ink-400 capitalize">{v.category}</td>
                <td className="px-4 py-3">
                  {editingCommission === v.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        value={commissionValue}
                        onChange={(e) => setCommissionValue(e.target.value)}
                        className="w-16 rounded border border-ink-100 px-1.5 py-1 text-xs font-mono"
                      />
                      <button onClick={() => setCommission.mutate({ id: v.id, value: commissionValue })} className="text-xs text-forest-600 font-semibold">
                        Save
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => startEditCommission(v)} className="font-mono text-ink-500 hover:text-forest-600 underline decoration-dotted">
                      {v.commission_percent}%
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge status={VERIFICATION_COLOR[v.verification_status]} label={v.verification_status.replace('_', ' ')} />
                </td>
                <td className="px-4 py-3">
                  <Badge status={v.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 items-center">
                    <button onClick={() => openView(v)} className="text-ink-300 hover:text-forest-600" title="View full details">
                      <Eye className="h-4 w-4" />
                    </button>
                    {v.status !== 'approved' && (
                      <Button size="sm" onClick={() => approve.mutate(v.id)} loading={approve.isPending}>Approve</Button>
                    )}
                    {v.status !== 'suspended' && (
                      <Button size="sm" variant="danger" onClick={() => suspend.mutate(v.id)} loading={suspend.isPending}>Suspend</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {data && data.results.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-ink-300">No vendors found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.shop_name ?? ''}>
        {viewing && (
          <div className="flex flex-col gap-4 text-sm max-h-[70vh] overflow-y-auto">
            <div className="flex items-center gap-2">
              <Badge status={viewing.status} />
              <Badge status={VERIFICATION_COLOR[viewing.verification_status]} label={viewing.verification_status.replace('_', ' ')} />
            </div>

            <section>
              <h3 className="text-xs font-semibold text-ink-300 uppercase mb-1.5">Basic Info</h3>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-ink-500">
                <span>Business name: {viewing.business_name || '—'}</span>
                <span>WhatsApp: {viewing.whatsapp_number || '—'}</span>
                <span>Owner: {viewing.owner_name}</span>
                <span>Phone: {viewing.owner_phone}</span>
                <span>Email: {viewing.owner_email || '—'}</span>
                <span>Category: {viewing.category}</span>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-ink-300 uppercase mb-1.5">Business Details</h3>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-ink-500">
                <span>GST: {viewing.gst_number || '—'}</span>
                <span>PAN: {viewing.pan_number || '—'}</span>
                <span>Business reg. no: {viewing.business_registration_number || '—'}</span>
                <span>Shop license: {viewing.shop_license_number || '—'}</span>
                <span>FSSAI: {viewing.fssai_license_number || '—'}</span>
                <span>Type: {viewing.business_type || '—'}</span>
                <span>Years in business: {viewing.years_in_business ?? '—'}</span>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-ink-300 uppercase mb-1.5">Bank Details</h3>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-ink-500">
                <span>Holder: {viewing.bank_account_holder_name || '—'}</span>
                <span>Bank: {viewing.bank_name || '—'}</span>
                <span>Account: {viewing.bank_account_number || '—'}</span>
                <span>IFSC: {viewing.bank_ifsc_code || '—'}</span>
                <span>UPI: {viewing.upi_id || '—'}</span>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-ink-300 uppercase mb-1.5">Address</h3>
              <p className="text-ink-500">{viewing.address_line}, {viewing.city}, {viewing.state} {viewing.pincode}, {viewing.country}</p>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-ink-300 uppercase mb-1.5">Documents ({documents.length})</h3>
              <div className="grid grid-cols-3 gap-2">
                {documents.map(([key, label], i) => (
                  <div key={key}>
                    <SecureImage
                      src={viewing[key as keyof AdminVendor] as string}
                      alt={label}
                      className="h-16 w-full object-cover rounded-lg border border-ink-100"
                      onClick={() => setLightboxIndex(i)}
                    />
                    <p className="text-[10px] text-ink-300 mt-0.5 truncate">{label}</p>
                  </div>
                ))}
                {documents.length === 0 && <p className="text-ink-300 text-xs col-span-3">No documents uploaded yet.</p>}
              </div>
            </section>

            {history && history.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold text-ink-300 uppercase mb-1.5">Verification History</h3>
                <div className="flex flex-col gap-1.5">
                  {history.map((h) => (
                    <div key={h.id} className="text-xs bg-rice-100 rounded-lg px-2.5 py-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-ink-500 capitalize">{h.action.replace('_', ' ')}</span>
                        <span className="text-ink-300">{new Date(h.created_at).toLocaleDateString()}</span>
                      </div>
                      {h.notes && <p className="text-ink-400 mt-0.5">{h.notes}</p>}
                      {h.reviewed_by_name && <p className="text-ink-300 mt-0.5">by {h.reviewed_by_name}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {actionMode && (
              <div className="rounded-lg border border-ink-100 p-2.5">
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={actionMode === 'reject' ? 'Reason for rejection...' : 'What needs to be resubmitted?'}
                  rows={2}
                  className="w-full rounded-lg border border-ink-100 px-2.5 py-1.5 text-xs outline-none focus:border-forest-400 resize-none"
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={!actionNotes}
                    loading={reject.isPending || requestResubmission.isPending}
                    onClick={() => (actionMode === 'reject' ? reject.mutate() : requestResubmission.mutate())}
                  >
                    Confirm {actionMode === 'reject' ? 'rejection' : 'resubmission request'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setActionMode(null); setActionNotes('') }}>Cancel</Button>
                </div>
              </div>
            )}

            {!actionMode && (
              <div className="flex gap-2 pt-2 border-t border-ink-100 flex-wrap">
                {viewing.verification_status !== 'under_review' && (
                  <Button size="sm" variant="ghost" onClick={() => markUnderReview.mutate(viewing.id)} loading={markUnderReview.isPending}>
                    Mark under review
                  </Button>
                )}
                <Button size="sm" onClick={() => approve.mutate(viewing.id)} loading={approve.isPending}>Approve</Button>
                <Button size="sm" variant="danger" onClick={() => setActionMode('reject')}>Reject</Button>
                <Button size="sm" variant="ghost" onClick={() => setActionMode('resubmission')}>Request resubmission</Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {lightboxIndex !== null && viewing && (
        <DocumentLightbox
          documents={documents.map(([key, label]) => ({ key, label, src: viewing[key as keyof AdminVendor] as string }))}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}
