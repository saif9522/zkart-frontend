import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { superAdminApi } from '@/api/superadmin'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { PasswordField } from '@/components/ui/PasswordField'
import { Modal } from '@/components/ui/Modal'
import { apiErrorMessage } from '@/api/client'
import type { StaffDepartment, StaffPermission } from '@/types'

const PERMISSION_FLAGS: { key: keyof StaffPermission; label: string }[] = [
  { key: 'can_manage_vendors', label: 'Vendors' },
  { key: 'can_manage_delivery_partners', label: 'Delivery partners' },
  { key: 'can_manage_orders', label: 'Orders' },
  { key: 'can_manage_coupons', label: 'Coupons' },
  { key: 'can_manage_categories', label: 'Categories' },
  { key: 'can_manage_users', label: 'Users' },
  { key: 'can_view_reports', label: 'Reports' },
]

const DEPARTMENTS: { value: StaffDepartment; label: string }[] = [
  { value: 'custom', label: 'Custom' },
  { value: 'full', label: 'Full access' },
  { value: 'accounts', label: 'Accounts / Finance' },
  { value: 'vendor_desk', label: 'Vendor desk' },
  { value: 'delivery_desk', label: 'Delivery desk' },
  { value: 'catalog', label: 'Catalog / Products' },
  { value: 'support', label: 'Customer support' },
]

// Mirror of the backend presets — used only to preview the checkboxes in the
// create form; the backend is the source of truth and re-applies them on save.
const DEPARTMENT_PRESETS: Record<StaffDepartment, Partial<Record<keyof StaffPermission, boolean>>> = {
  custom: {},
  full: {
    can_manage_vendors: true, can_manage_delivery_partners: true, can_manage_orders: true,
    can_manage_coupons: true, can_manage_categories: true, can_manage_users: true, can_view_reports: true,
  },
  accounts: { can_view_reports: true, can_manage_orders: true },
  vendor_desk: { can_manage_vendors: true, can_manage_orders: true },
  delivery_desk: { can_manage_delivery_partners: true, can_manage_orders: true },
  catalog: { can_manage_categories: true, can_manage_coupons: true },
  support: { can_manage_users: true, can_manage_orders: true },
}

const emptyForm = {
  phone: '',
  full_name: '',
  password: '',
  department: 'custom' as StaffDepartment,
  can_manage_vendors: false,
  can_manage_delivery_partners: false,
  can_manage_orders: false,
  can_manage_coupons: false,
  can_manage_categories: false,
  can_manage_users: false,
  can_view_reports: true,
}

export function StaffPage() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey: ['staff-permissions'], queryFn: superAdminApi.staffPermissions })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['staff-permissions'] })

  const createAdmin = useMutation({
    mutationFn: () =>
      superAdminApi.createAdmin({
        phone: form.phone.startsWith('+91') ? form.phone : `+91${form.phone.replace(/\D/g, '')}`,
        full_name: form.full_name,
        password: form.password,
        department: form.department,
        can_manage_vendors: form.can_manage_vendors,
        can_manage_delivery_partners: form.can_manage_delivery_partners,
        can_manage_orders: form.can_manage_orders,
        can_manage_coupons: form.can_manage_coupons,
        can_manage_categories: form.can_manage_categories,
        can_manage_users: form.can_manage_users,
        can_view_reports: form.can_view_reports,
      }),
    onSuccess: () => {
      invalidate()
      setOpen(false)
      setForm(emptyForm)
      setError('')
    },
    onError: (err) => setError(apiErrorMessage(err, 'Could not create admin.')),
  })

  // Picking a department in the form previews its section checkboxes.
  const pickDepartment = (dept: StaffDepartment) => {
    if (dept === 'custom') {
      setForm((f) => ({ ...f, department: dept }))
      return
    }
    const preset = DEPARTMENT_PRESETS[dept]
    setForm((f) => ({
      ...f,
      department: dept,
      can_manage_vendors: !!preset.can_manage_vendors,
      can_manage_delivery_partners: !!preset.can_manage_delivery_partners,
      can_manage_orders: !!preset.can_manage_orders,
      can_manage_coupons: !!preset.can_manage_coupons,
      can_manage_categories: !!preset.can_manage_categories,
      can_manage_users: !!preset.can_manage_users,
      can_view_reports: !!preset.can_view_reports,
    }))
  }

  const setDepartment = useMutation({
    mutationFn: ({ id, department }: { id: string; department: StaffDepartment }) =>
      superAdminApi.updateStaffPermission(id, { department }),
    onSuccess: invalidate,
  })

  const togglePermission = useMutation({
    mutationFn: ({ id, key, value }: { id: string; key: keyof StaffPermission; value: boolean }) =>
      superAdminApi.updateStaffPermission(id, { department: 'custom', [key]: value }),
    onSuccess: invalidate,
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-500">Staff &amp; RBAC</h1>
          <p className="text-sm text-ink-300">Create admin accounts and control exactly what each one can manage.</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New admin
        </Button>
      </div>

      {isLoading && <p className="text-ink-300 animate-pulse">Loading...</p>}

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs text-ink-300">
              <th className="px-4 py-3 font-medium">Admin</th>
              <th className="px-4 py-3 font-medium">Department</th>
              {PERMISSION_FLAGS.map((f) => (
                <th key={f.key} className="px-3 py-3 font-medium text-center">
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.results.map((perm) => (
              <tr key={perm.id} className="border-b border-ink-100/60 last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium text-ink-500">{perm.user_name}</div>
                  <div className="text-xs font-mono text-ink-300">{perm.user_phone}</div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={perm.department}
                    onChange={(e) => setDepartment.mutate({ id: perm.id, department: e.target.value as StaffDepartment })}
                    className="rounded-lg border border-ink-100 bg-white px-2 py-1.5 text-xs text-ink-500"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </td>
                {PERMISSION_FLAGS.map((f) => (
                  <td key={f.key} className="px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={perm[f.key] as boolean}
                      onChange={(e) =>
                        togglePermission.mutate({ id: perm.id, key: f.key, value: e.target.checked })
                      }
                      className="accent-forest-600 h-4 w-4"
                    />
                  </td>
                ))}
              </tr>
            ))}
            {data && data.results.length === 0 && (
              <tr>
                <td colSpan={PERMISSION_FLAGS.length + 2} className="px-4 py-8 text-center text-ink-300">
                  No admin accounts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New admin account">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createAdmin.mutate()
          }}
          className="flex flex-col gap-3"
        >
          <Field label="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required autoFocus />
          <Field label="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          <PasswordField
            label="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          <div>
            <label className="text-xs font-semibold text-ink-400">Department (preset)</label>
            <select
              value={form.department}
              onChange={(e) => pickDepartment(e.target.value as StaffDepartment)}
              className="mt-1.5 w-full rounded-lg border border-ink-100 bg-white px-2.5 py-2 text-sm text-ink-500"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            <p className="text-[11px] text-ink-300 mt-1">
              Pick a department to auto-tick its sections, or choose Custom and tick them yourself.
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold text-ink-400">Permissions</span>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {PERMISSION_FLAGS.map((f) => (
                <label key={f.key} className="flex items-center gap-2 text-sm text-ink-500">
                  <input
                    type="checkbox"
                    checked={form[f.key as keyof typeof form] as boolean}
                    onChange={(e) => setForm({ ...form, department: 'custom', [f.key]: e.target.checked })}
                    className="accent-forest-600 h-4 w-4"
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-chili-600">{error}</p>}
          <Button type="submit" loading={createAdmin.isPending} className="mt-2">
            Create admin
          </Button>
        </form>
      </Modal>
    </div>
  )
}
