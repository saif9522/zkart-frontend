import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Power, Store } from 'lucide-react'
import { vendorApi } from '@/api/vendor'
import { apiErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Badge } from '@/components/ui/Badge'

/** Shop settings the vendor can safely change themselves. KYC & bank details stay with admin. */
export function SettingsPage() {
  const queryClient = useQueryClient()
  const { data: vendor, isLoading } = useQuery({ queryKey: ['vendor-profile'], queryFn: vendorApi.profile })
  const [form, setForm] = useState({ shop_name: '', whatsapp_number: '', address_line: '', pincode: '' })
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (vendor) {
      setForm({
        shop_name: vendor.shop_name,
        whatsapp_number: vendor.whatsapp_number,
        address_line: vendor.address_line,
        pincode: vendor.pincode,
      })
    }
  }, [vendor])

  const save = useMutation({
    mutationFn: () => vendorApi.updateProfile(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] })
      queryClient.invalidateQueries({ queryKey: ['vendor-dashboard'] })
      setMsg({ ok: true, text: 'Saved.' })
    },
    onError: (err) => setMsg({ ok: false, text: apiErrorMessage(err, 'Could not save.') }),
  })

  if (isLoading || !vendor) return <p className="text-ink-300 animate-pulse">Loading...</p>

  return (
    <div className="flex flex-col gap-5 max-w-xl">
      <h1 className="text-xl font-bold text-ink-500 flex items-center gap-2">
        <Store className="h-5 w-5 text-forest-600" /> Shop settings
      </h1>

      <ShopOpenToggle />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          setMsg(null)
          save.mutate()
        }}
        className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4 flex flex-col gap-3"
      >
        <Field label="Shop name" value={form.shop_name} onChange={(e) => setForm({ ...form, shop_name: e.target.value })} required />
        <Field
          label="WhatsApp number (customers & riders may contact you here)"
          value={form.whatsapp_number}
          onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
        />
        <Field label="Shop address" value={form.address_line} onChange={(e) => setForm({ ...form, address_line: e.target.value })} required />
        <Field label="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
        {msg && <p className={`text-sm ${msg.ok ? 'text-forest-600' : 'text-chili-600'}`}>{msg.text}</p>}
        <Button type="submit" loading={save.isPending} className="self-start">
          Save changes
        </Button>
      </form>

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4 text-sm flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-ink-500">KYC & payout details</span>
          <Badge status={vendor.status} />
        </div>
        <p className="text-ink-400">Commission: {vendor.commission_percent}% per delivered order</p>
        <p className="text-ink-400">
          Payout to: {vendor.upi_id || (vendor.bank_account_number ? `A/c ••••${vendor.bank_account_number.slice(-4)}` : 'not set')}
        </p>
        <p className="text-xs text-ink-300">To change bank / UPI / documents, contact zKart support — this protects your payouts from misuse.</p>
      </div>
    </div>
  )
}

/** Big, obvious Open/Closed switch. Closed shops can't receive orders. */
export function ShopOpenToggle() {
  const queryClient = useQueryClient()
  const { data } = useQuery({ queryKey: ['vendor-dashboard'], queryFn: vendorApi.dashboard })
  const toggle = useMutation({
    mutationFn: (is_open: boolean) => vendorApi.updateProfile({ is_open }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] })
    },
  })
  if (!data) return null
  const open = data.is_open
  return (
    <div
      className={`rounded-[var(--radius-card)] border p-4 flex items-center justify-between gap-3 ${
        open ? 'bg-forest-50 border-forest-100' : 'bg-chili-100/60 border-chili-100'
      }`}
    >
      <div>
        <p className="font-semibold text-ink-500">{open ? 'Shop is OPEN' : 'Shop is CLOSED'}</p>
        <p className="text-xs text-ink-400">
          {open ? 'Customers can order from you right now.' : 'Customers cannot place new orders until you open.'}
        </p>
      </div>
      <Button
        variant={open ? 'danger' : 'primary'}
        onClick={() => toggle.mutate(!open)}
        loading={toggle.isPending}
        className="shrink-0"
      >
        <Power className="h-4 w-4" /> {open ? 'Close shop' : 'Open shop'}
      </Button>
    </div>
  )
}
