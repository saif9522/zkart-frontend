import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bike, ChevronLeft, ChevronRight, Upload } from 'lucide-react'
import { deliveryApi } from '@/api/delivery'
import { apiErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import type { Gender, VehicleType } from '@/types'

const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: 'bicycle', label: 'Bicycle' },
  { value: 'bike', label: 'Motorbike / Scooter' },
  { value: 'car', label: 'Car' },
]

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

const STEPS = ['Personal', 'Address', 'Vehicle & Identity', 'Documents']

const DOCUMENTS: { key: string; label: string; required: boolean }[] = [
  { key: 'aadhaar_front_image', label: 'Aadhaar Card — Front', required: true },
  { key: 'aadhaar_back_image', label: 'Aadhaar Card — Back', required: true },
  { key: 'license_front_image', label: 'Driving License — Front', required: true },
  { key: 'license_back_image', label: 'Driving License — Back', required: true },
  { key: 'vehicle_rc_image', label: 'Vehicle RC', required: false },
  { key: 'vehicle_insurance_image', label: 'Vehicle Insurance', required: false },
  { key: 'pan_card_image', label: 'PAN Card (optional)', required: false },
  { key: 'passport_photo', label: 'Passport-size Photo', required: true },
  { key: 'selfie_photo', label: 'Live Selfie', required: true },
]

const emptyForm = {
  whatsapp_number: '', date_of_birth: '', gender: '' as Gender | '',
  current_address: '', permanent_address: '', city: 'Garhwa', state: 'Jharkhand', pincode: '', country: 'India',
  vehicle_type: 'bike' as VehicleType, vehicle_number: '', vehicle_rc_number: '',
  insurance_number: '', insurance_expiry_date: '',
  aadhaar_number: '', license_number: '', pan_number: '',
}

export function OnboardPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(emptyForm)
  const [files, setFiles] = useState<Record<string, File | null>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value })

  const missingRequiredDocs = DOCUMENTS.filter((d) => d.required && !files[d.key]).map((d) => d.label)

  const handleNext = () => {
    setError('')
    if (step === 0 && !form.whatsapp_number) {
      setError('WhatsApp number is required.')
      return
    }
    if (step === 1 && !form.current_address) {
      setError('Current address is required.')
      return
    }
    if (step === 2 && (!form.aadhaar_number || !form.license_number)) {
      setError('Aadhaar and license number are required.')
      return
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const handleSubmit = async () => {
    setError('')
    if (missingRequiredDocs.length > 0) {
      setError(`Please upload: ${missingRequiredDocs.join(', ')}`)
      return
    }
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, String(v)))
      Object.entries(files).forEach(([k, f]) => f && fd.append(k, f))
      await deliveryApi.onboard(fd)
      navigate('/')
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not complete registration. Please check the details and try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-rice-100 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-forest-600 flex items-center justify-center mx-auto">
            <Bike className="h-6 w-6 text-rice-50" />
          </div>
          <h1 className="font-bold text-xl text-ink-500 mt-3">Complete your registration</h1>
          <p className="text-sm text-ink-300">One-time setup — your account will be reviewed before you can go online.</p>
        </div>

        <div className="flex items-center justify-between mb-4 px-1">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-1.5 w-full rounded-full ${i <= step ? 'bg-forest-600' : 'bg-ink-100'}`} />
              <span className={`text-[10px] ${i === step ? 'text-forest-600 font-semibold' : 'text-ink-300'}`}>{label}</span>
            </div>
          ))}
        </div>

        <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-6 flex flex-col gap-4">
          {step === 0 && (
            <>
              <Field label="WhatsApp number" value={form.whatsapp_number} onChange={set('whatsapp_number')} required autoFocus placeholder="+91 98765 43210" />
              <Field label="Date of birth" type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink-400">Gender</span>
                <select value={form.gender} onChange={set('gender')} className="rounded-lg border border-ink-100 bg-rice-100 px-3 py-2 text-sm outline-none focus:border-forest-400">
                  <option value="">Select</option>
                  {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </label>
            </>
          )}

          {step === 1 && (
            <>
              <Field label="Current address" value={form.current_address} onChange={set('current_address')} required />
              <Field label="Permanent address" value={form.permanent_address} onChange={set('permanent_address')} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="City" value={form.city} onChange={set('city')} required />
                <Field label="State" value={form.state} onChange={set('state')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Pincode" value={form.pincode} onChange={set('pincode')} />
                <Field label="Country" value={form.country} onChange={set('country')} />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink-400">Vehicle type</span>
                <select value={form.vehicle_type} onChange={set('vehicle_type')} className="rounded-lg border border-ink-100 bg-rice-100 px-3 py-2 text-sm outline-none focus:border-forest-400">
                  {VEHICLE_TYPES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                </select>
              </label>
              <Field
                label={form.vehicle_type === 'bicycle' ? 'Vehicle number (optional)' : 'Vehicle number'}
                value={form.vehicle_number} onChange={set('vehicle_number')} required={form.vehicle_type !== 'bicycle'}
              />
              <Field label="Vehicle RC number" value={form.vehicle_rc_number} onChange={set('vehicle_rc_number')} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Insurance number" value={form.insurance_number} onChange={set('insurance_number')} />
                <Field label="Insurance expiry" type="date" value={form.insurance_expiry_date} onChange={set('insurance_expiry_date')} />
              </div>
              <Field label="Aadhaar number" value={form.aadhaar_number} onChange={set('aadhaar_number')} required placeholder="12-digit number" />
              <Field
                label={form.vehicle_type === 'bicycle' ? 'Driving license (optional)' : 'Driving license number'}
                value={form.license_number} onChange={set('license_number')} required={form.vehicle_type !== 'bicycle'}
              />
              <Field label="PAN number (optional)" value={form.pan_number} onChange={set('pan_number')} />
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-xs text-ink-300 -mt-1">Clear photos or scans — required docs are marked *.</p>
              {DOCUMENTS.map((doc) => (
                <label key={doc.key} className="flex items-center justify-between gap-2 rounded-lg border border-ink-100 px-3 py-2.5 cursor-pointer">
                  <span className="text-sm text-ink-500">
                    {doc.label} {doc.required && <span className="text-chili-600">*</span>}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-forest-600 shrink-0">
                    <Upload className="h-3.5 w-3.5" />
                    {files[doc.key] ? files[doc.key]!.name.slice(0, 14) : 'Upload'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setFiles({ ...files, [doc.key]: e.target.files?.[0] ?? null })}
                  />
                </label>
              ))}
            </>
          )}

          {error && <p className="text-xs text-chili-600">{error}</p>}

          <div className="flex items-center gap-2 mt-2">
            {step > 0 && (
              <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)}>
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={handleNext} className="ml-auto">
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} loading={loading} className="ml-auto">
                Submit for review
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
