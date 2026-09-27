import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'
import { apiErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import type { AdminDeliveryPartner, AdminVendor } from '@/types'

const input = 'rounded-lg border border-ink-100 bg-rice-100 px-3 py-2 text-sm outline-none focus:border-forest-400'

/** Add a new shop, or edit an existing one (same form). */
export function VendorFormModal({ open, vendor, onClose }: { open: boolean; vendor: AdminVendor | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const blank = {
    phone: '', full_name: '', password: '', shop_name: '', business_name: '', category: 'grocery', gst_number: '',
    whatsapp_number: '', address_line: '', city: 'Garhwa', pincode: '', latitude: '24.1600', longitude: '83.8000', commission_percent: '10',
    branch_code: '', service_pincodes: '',
  }
  const [f, setF] = useState(blank)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!open) return
    setError('')
    setF(
      vendor
        ? {
            ...blank,
            shop_name: vendor.shop_name ?? '', business_name: (vendor as any).business_name ?? '', category: vendor.category ?? 'grocery', // eslint-disable-line @typescript-eslint/no-explicit-any
            gst_number: vendor.gst_number ?? '', whatsapp_number: (vendor as any).whatsapp_number ?? '', // eslint-disable-line @typescript-eslint/no-explicit-any
            address_line: vendor.address_line ?? '', city: vendor.city ?? '', pincode: (vendor as any).pincode ?? '', // eslint-disable-line @typescript-eslint/no-explicit-any
            latitude: String(vendor.latitude ?? ''), longitude: String(vendor.longitude ?? ''), commission_percent: String(vendor.commission_percent ?? '10'),
            branch_code: vendor.branch_code ?? '', service_pincodes: vendor.service_pincodes ?? '',
          }
        : blank
    )
  }, [open, vendor]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMutation({
    mutationFn: async () => {
      if (vendor) {
        const { phone: _p, full_name: _n, password: _pw, ...rest } = f
        return adminApi.updateVendor(vendor.id, rest)
      }
      return adminApi.createVendor({ ...f, password: f.password || undefined })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      onClose()
    },
    onError: (e) => setError(apiErrorMessage(e, 'Could not save the shop.')),
  })
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })

  return (
    <Modal open={open} onClose={onClose} title={vendor ? `Edit ${vendor.shop_name}` : 'Add new shop (vendor)'}>
      <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="flex flex-col gap-3">
        {!vendor && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Owner phone" placeholder="+91XXXXXXXXXX" value={f.phone} onChange={set('phone')} required />
              <Field label="Owner name" value={f.full_name} onChange={set('full_name')} required />
            </div>
            <Field label="Password (optional — blank = login with OTP)" type="password" value={f.password} onChange={set('password')} />
            <p className="text-[11px] text-ink-300 -mt-1">Agar ye number pehle se customer hai, to wahi account dukaan ka maalik ban jaayega.</p>
          </>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Shop name" value={f.shop_name} onChange={set('shop_name')} required />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-400">Type</span>
            <select value={f.category} onChange={set('category')} className={input}>
              {['grocery', 'pharmacy', 'restaurant', 'bakery', 'electronics', 'fashion', 'other'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="WhatsApp number" value={f.whatsapp_number} onChange={set('whatsapp_number')} />
          <Field label="GST number (optional)" value={f.gst_number} onChange={set('gst_number')} />
        </div>
        <Field label="Shop address" value={f.address_line} onChange={set('address_line')} required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="City" value={f.city} onChange={set('city')} />
          <Field label="Pincode" value={f.pincode} onChange={set('pincode')} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Latitude" value={f.latitude} onChange={set('latitude')} required />
          <Field label="Longitude" value={f.longitude} onChange={set('longitude')} required />
          <Field label="Commission %" value={f.commission_percent} onChange={set('commission_percent')} />
        </div>
        <p className="text-[11px] text-ink-300 -mt-1">Latitude/Longitude: Google Maps pe dukaan pe right-click karke copy karein.</p>
        <div className="rounded-lg border border-forest-100 bg-forest-50/50 p-3 flex flex-col gap-2">
          <p className="text-xs font-semibold text-forest-700">Branch (Zepto jaisa)</p>
          <Field label="Branch code (khaali = apne-aap agla number, jaise 00003)" value={f.branch_code} onChange={set('branch_code')} placeholder="00001" />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-400">Delivery pincodes (comma se alag)</span>
            <textarea
              rows={2}
              value={f.service_pincodes}
              onChange={(e) => setF({ ...f, service_pincodes: e.target.value })}
              placeholder="110025, 110062"
              className="rounded-lg border border-ink-100 bg-rice-100 px-3 py-2 text-sm outline-none focus:border-forest-400 font-mono"
            />
          </label>
          <p className="text-[11px] text-ink-300">Delivery hogi agar address ka pincode is list mein ho, <b>ya</b> dukaan se 10 km ke andar ho.</p>
        </div>
        {error && <p className="text-xs text-chili-600">{error}</p>}
        <Button type="submit" loading={save.isPending}>{vendor ? 'Save changes' : 'Add shop (approved)'}</Button>
      </form>
    </Modal>
  )
}

/** Add a new delivery partner, or edit one. */
export function DeliveryFormModal({ open, partner, onClose }: { open: boolean; partner: AdminDeliveryPartner | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const blank = { phone: '', full_name: '', password: '', vehicle_type: 'bike', vehicle_number: '', city: 'Garhwa', whatsapp_number: '', license_number: '', current_address: '', pincode: '' }
  const [f, setF] = useState(blank)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!open) return
    setError('')
    const p = partner as unknown as Record<string, string> | null
    setF(p ? { ...blank, full_name: p.owner_name ?? '', vehicle_type: p.vehicle_type ?? 'bike', vehicle_number: p.vehicle_number ?? '', city: p.city ?? '',
      whatsapp_number: p.whatsapp_number ?? '', license_number: p.license_number ?? '', current_address: p.current_address ?? '', pincode: p.pincode ?? '' } : blank)
  }, [open, partner]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMutation({
    mutationFn: async () => {
      if (partner) {
        const { phone: _p, password: _pw, ...rest } = f
        return adminApi.updateDeliveryPartner(partner.id, rest)
      }
      return adminApi.createDeliveryPartner({ ...f, password: f.password || undefined })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-partners'] })
      onClose()
    },
    onError: (e) => setError(apiErrorMessage(e, 'Could not save.')),
  })
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })

  return (
    <Modal open={open} onClose={onClose} title={partner ? `Edit ${f.full_name || 'delivery partner'}` : 'Add delivery partner'}>
      <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="flex flex-col gap-3">
        {!partner && (
          <>
            <Field label="Phone" placeholder="+91XXXXXXXXXX" value={f.phone} onChange={set('phone')} required />
            <Field label="Password (optional — blank = login with OTP)" type="password" value={f.password} onChange={set('password')} />
          </>
        )}
        <Field label="Full name" value={f.full_name} onChange={set('full_name')} required />
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-400">Vehicle</span>
            <select value={f.vehicle_type} onChange={set('vehicle_type')} className={input}>
              <option value="bike">Bike</option>
              <option value="bicycle">Bicycle</option>
              <option value="car">Car</option>
            </select>
          </label>
          <Field label="Vehicle number" value={f.vehicle_number} onChange={set('vehicle_number')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="WhatsApp" value={f.whatsapp_number} onChange={set('whatsapp_number')} />
          <Field label="City" value={f.city} onChange={set('city')} />
        </div>
        {partner && (
          <>
            <Field label="Driving licence number" value={f.license_number} onChange={set('license_number')} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Address" value={f.current_address} onChange={set('current_address')} />
              <Field label="Pincode" value={f.pincode} onChange={set('pincode')} />
            </div>
          </>
        )}
        {error && <p className="text-xs text-chili-600">{error}</p>}
        <Button type="submit" loading={save.isPending}>{partner ? 'Save changes' : 'Add partner (approved)'}</Button>
      </form>
    </Modal>
  )
}
