import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Store, Upload } from 'lucide-react'
import { vendorApi } from '@/api/vendor'
import { apiErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { LocationPickerMap } from '@/components/ui/LocationPickerMap'
import type { BusinessType, ShopCategory } from '@/types'

const CATEGORIES: { value: ShopCategory; label: string }[] = [
  { value: 'grocery', label: 'Grocery' },
  { value: 'fruits_vegetables', label: 'Fruits & Vegetables' },
  { value: 'medical', label: 'Medical' },
  { value: 'bakery', label: 'Bakery' },
  { value: 'meat', label: 'Meat' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
]

const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: 'sole_proprietorship', label: 'Sole proprietorship' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'private_limited', label: 'Private limited company' },
  { value: 'llp', label: 'LLP' },
  { value: 'other', label: 'Other' },
]

const STEPS = ['Basic Info', 'Business Details', 'Bank Details', 'Address', 'Documents']

const DOCUMENTS: { key: string; label: string; required: boolean }[] = [
  { key: 'gst_certificate', label: 'GST Certificate', required: false },
  { key: 'pan_card', label: 'PAN Card', required: true },
  { key: 'aadhaar_card', label: 'Aadhaar Card', required: true },
  { key: 'shop_document', label: 'Shop License', required: true },
  { key: 'business_registration_document', label: 'Business Registration Certificate', required: false },
  { key: 'fssai_license_document', label: 'FSSAI License (food businesses)', required: false },
  { key: 'cancelled_cheque', label: 'Cancelled Cheque / Bank Proof', required: true },
  { key: 'shop_front_photo', label: 'Shop Front Photo', required: true },
  { key: 'shop_interior_photo', label: 'Shop Interior Photo', required: false },
  { key: 'owner_photo', label: 'Owner Photo', required: true },
]

const emptyForm = {
  shop_name: '', business_name: '', whatsapp_number: '', category: 'grocery' as ShopCategory,
  gst_number: '', pan_number: '', business_registration_number: '', shop_license_number: '',
  fssai_license_number: '', business_type: '' as BusinessType | '', years_in_business: '',
  bank_account_holder_name: '', bank_name: '', bank_account_number: '', bank_ifsc_code: '', upi_id: '',
  address_line: '', city: 'Garhwa', state: 'Jharkhand', pincode: '', country: 'India',
  latitude: '24.1553', longitude: '83.8099',
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
    if (step === 0 && (!form.shop_name || !form.whatsapp_number)) {
      setError('Shop name and WhatsApp number are required.')
      return
    }
    if (step === 3 && !form.address_line) {
      setError('Shop address is required.')
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
      await vendorApi.onboard(fd)
      navigate('/')
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not register your shop. Please check the details and try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-rice-100 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-forest-600 flex items-center justify-center mx-auto">
            <Store className="h-6 w-6 text-rice-50" />
          </div>
          <h1 className="font-bold text-xl text-ink-500 mt-3">Register your shop</h1>
          <p className="text-sm text-ink-300">One-time setup — your shop will be reviewed before it goes live.</p>
        </div>

        {/* Step indicator */}
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
              <Field label="Shop name" value={form.shop_name} onChange={set('shop_name')} required autoFocus />
              <Field label="Business name (if different)" value={form.business_name} onChange={set('business_name')} />
              <Field label="WhatsApp number" value={form.whatsapp_number} onChange={set('whatsapp_number')} required placeholder="+91 98765 43210" />
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink-400">Category</span>
                <select value={form.category} onChange={set('category')} className="rounded-lg border border-ink-100 bg-rice-100 px-3 py-2 text-sm outline-none focus:border-forest-400">
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </label>
            </>
          )}

          {step === 1 && (
            <>
              <Field label="GST number (optional)" value={form.gst_number} onChange={set('gst_number')} />
              <Field label="PAN number" value={form.pan_number} onChange={set('pan_number')} />
              <Field label="Business registration number (optional)" value={form.business_registration_number} onChange={set('business_registration_number')} />
              <Field label="Shop license number" value={form.shop_license_number} onChange={set('shop_license_number')} />
              <Field label="FSSAI license number (food businesses)" value={form.fssai_license_number} onChange={set('fssai_license_number')} />
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink-400">Business type</span>
                <select value={form.business_type} onChange={set('business_type')} className="rounded-lg border border-ink-100 bg-rice-100 px-3 py-2 text-sm outline-none focus:border-forest-400">
                  <option value="">Select</option>
                  {BUSINESS_TYPES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </label>
              <Field label="Years in business" type="number" value={form.years_in_business} onChange={set('years_in_business')} />
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-xs text-ink-300 -mt-1">Used to pay out your earnings — kept private, never shown to customers.</p>
              <Field label="Account holder name" value={form.bank_account_holder_name} onChange={set('bank_account_holder_name')} />
              <Field label="Bank name" value={form.bank_name} onChange={set('bank_name')} />
              <Field label="Account number" value={form.bank_account_number} onChange={set('bank_account_number')} />
              <Field label="IFSC code" value={form.bank_ifsc_code} onChange={set('bank_ifsc_code')} />
              <Field label="UPI ID (optional)" value={form.upi_id} onChange={set('upi_id')} placeholder="you@upi" />
            </>
          )}

          {step === 3 && (
            <>
              <Field label="Shop address" value={form.address_line} onChange={set('address_line')} required />
              <div className="grid grid-cols-2 gap-3">
                <Field label="City" value={form.city} onChange={set('city')} required />
                <Field label="State" value={form.state} onChange={set('state')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Pincode" value={form.pincode} onChange={set('pincode')} />
                <Field label="Country" value={form.country} onChange={set('country')} />
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink-400">Shop location on map</span>
                <LocationPickerMap
                  latitude={Number(form.latitude)}
                  longitude={Number(form.longitude)}
                  onChange={(lat, lng) => setForm({ ...form, latitude: lat.toFixed(6), longitude: lng.toFixed(6) })}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Latitude" type="number" value={form.latitude} onChange={set('latitude')} required />
                <Field label="Longitude" type="number" value={form.longitude} onChange={set('longitude')} required />
              </div>
            </>
          )}

          {step === 4 && (
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
