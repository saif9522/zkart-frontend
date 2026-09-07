import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SecureImage } from '@/components/ui/SecureImage'
import { DocumentLightbox } from '@/components/ui/DocumentLightbox'
import type { AdminDeliveryPartner } from '@/types'

const STATUS_TABS = ['all', 'pending', 'approved', 'suspended'] as const

const DOC_LABELS: Record<string, string> = {
  aadhaar_front_image: 'Aadhaar — Front', aadhaar_back_image: 'Aadhaar — Back',
  license_front_image: 'License — Front', license_back_image: 'License — Back',
  vehicle_rc_image: 'Vehicle RC', vehicle_insurance_image: 'Vehicle Insurance',
  pan_card_image: 'PAN Card', passport_photo: 'Passport Photo', selfie_photo: 'Selfie',
}

const VERIFICATION_COLOR: Record<string, 'pending' | 'active' | 'failed' | 'approved'> = {
  documents_submitted: 'pending', under_review: 'pending', approved: 'active',
  rejected: 'failed', resubmission_required: 'approved',
}

export function DeliveryPartnersPage() {
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]>('all')
  const [viewing, setViewing] = useState<AdminDeliveryPartner | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [actionMode, setActionMode] = useState<'reject' | 'resubmission' | null>(null)
  const [actionNotes, setActionNotes] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['delivery-partners', status],
    queryFn: () => adminApi.deliveryPartners(status === 'all' ? {} : { status }),
  })
  const { data: history } = useQuery({
    queryKey: ['delivery-verification-history', viewing?.id],
    queryFn: () => adminApi.deliveryVerificationHistory(viewing!.id),
    enabled: !!viewing,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['delivery-partners'] })
  const refreshViewing = async () => {
    if (viewing) setViewing(await adminApi.deliveryPartner(viewing.id))
    queryClient.invalidateQueries({ queryKey: ['delivery-verification-history'] })
  }

  const approve = useMutation({
    mutationFn: (id: string) => adminApi.approveDeliveryPartner(id),
    onSuccess: () => { invalidate(); refreshViewing() },
  })
  const markUnderReview = useMutation({
    mutationFn: (id: string) => adminApi.markDeliveryUnderReview(id),
    onSuccess: () => { invalidate(); refreshViewing() },
  })
  const suspend = useMutation({ mutationFn: adminApi.suspendDeliveryPartner, onSuccess: invalidate })
  const reject = useMutation({
    mutationFn: () => adminApi.rejectDeliveryPartner(viewing!.id, actionNotes),
    onSuccess: () => { invalidate(); refreshViewing(); setActionMode(null); setActionNotes('') },
  })
  const requestResubmission = useMutation({
    mutationFn: () => adminApi.requestDeliveryResubmission(viewing!.id, actionNotes),
    onSuccess: () => { invalidate(); refreshViewing(); setActionMode(null); setActionNotes('') },
  })

  const openView = async (p: AdminDeliveryPartner) => {
    setActionMode(null)
    setActionNotes('')
    setViewing(await adminApi.deliveryPartner(p.id))
  }

  const documents = viewing
    ? Object.entries(DOC_LABELS).filter(([key]) => viewing[key as keyof AdminDeliveryPartner])
    : []

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-ink-500">Delivery Partners</h1>

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
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Vehicle</th>
              <th className="px-4 py-3 font-medium">Rating</th>
              <th className="px-4 py-3 font-medium">Verification</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-300">Loading...</td></tr>
            )}
            {data?.results.map((p) => (
              <tr key={p.id} className="border-b border-ink-100/60 last:border-0">
                <td className="px-4 py-3 font-medium text-ink-500">
                  {p.owner_name}
                  <div className="text-xs font-mono text-ink-300">{p.owner_phone}</div>
                </td>
                <td className="px-4 py-3 text-ink-400 capitalize">{p.vehicle_type} · {p.vehicle_number || '—'}</td>
                <td className="px-4 py-3 text-ink-400">{p.rating_avg} ({p.rating_count})</td>
                <td className="px-4 py-3">
                  <Badge status={VERIFICATION_COLOR[p.verification_status]} label={p.verification_status.replace('_', ' ')} />
                </td>
                <td className="px-4 py-3"><Badge status={p.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 items-center">
                    <button onClick={() => openView(p)} className="text-ink-300 hover:text-forest-600" title="View full details">
                      <Eye className="h-4 w-4" />
                    </button>
                    {p.status !== 'approved' && (
                      <Button size="sm" onClick={() => approve.mutate(p.id)} loading={approve.isPending}>Approve</Button>
                    )}
                    {p.status !== 'suspended' && (
                      <Button size="sm" variant="danger" onClick={() => suspend.mutate(p.id)} loading={suspend.isPending}>Suspend</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {data && data.results.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-300">No delivery partners found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.owner_name ?? ''}>
        {viewing && (
          <div className="flex flex-col gap-4 text-sm max-h-[70vh] overflow-y-auto">
            <div className="flex items-center gap-2">
              <Badge status={viewing.status} />
              <Badge status={VERIFICATION_COLOR[viewing.verification_status]} label={viewing.verification_status.replace('_', ' ')} />
            </div>

            <section>
              <h3 className="text-xs font-semibold text-ink-300 uppercase mb-1.5">Personal Info</h3>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-ink-500">
                <span>Phone: {viewing.owner_phone}</span>
                <span>Email: {viewing.owner_email || '—'}</span>
                <span>WhatsApp: {viewing.whatsapp_number || '—'}</span>
                <span>DOB: {viewing.date_of_birth || '—'}</span>
                <span>Gender: {viewing.gender || '—'}</span>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-ink-300 uppercase mb-1.5">Address</h3>
              <div className="text-ink-500">
                <p>Current: {viewing.current_address || '—'}</p>
                <p>Permanent: {viewing.permanent_address || '—'}</p>
                <p>{viewing.city}, {viewing.state} {viewing.pincode}, {viewing.country}</p>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-ink-300 uppercase mb-1.5">Vehicle</h3>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-ink-500 capitalize">
                <span>Type: {viewing.vehicle_type}</span>
                <span>Number: {viewing.vehicle_number || '—'}</span>
                <span>RC number: {viewing.vehicle_rc_number || '—'}</span>
                <span>Insurance: {viewing.insurance_number || '—'}</span>
                <span>Insurance expiry: {viewing.insurance_expiry_date || '—'}</span>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-ink-300 uppercase mb-1.5">Identity</h3>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-ink-500">
                <span>Aadhaar: {viewing.aadhaar_number || '—'}</span>
                <span>License: {viewing.license_number || '—'}</span>
                <span>PAN: {viewing.pan_number || '—'}</span>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-ink-300 uppercase mb-1.5">Documents ({documents.length})</h3>
              <div className="grid grid-cols-3 gap-2">
                {documents.map(([key, label], i) => (
                  <div key={key}>
                    <SecureImage
                      src={viewing[key as keyof AdminDeliveryPartner] as string}
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
          documents={documents.map(([key, label]) => ({ key, label, src: viewing[key as keyof AdminDeliveryPartner] as string }))}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}
