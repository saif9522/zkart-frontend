import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { apiErrorMessage } from '@/api/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'
import type { User } from '@/types'

const ROLE_TABS = ['', 'customer', 'vendor', 'delivery', 'admin', 'super_admin']

export function UsersPage() {
  const [role, setRole] = useState('')
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState<User | null>(null)
  const [editing, setEditing] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({ full_name: '', email: '' })
  const [formError, setFormError] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['users', role, search],
    queryFn: () => adminApi.users({ role: role || undefined, search: search || undefined }),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] })
  const activate = useMutation({ mutationFn: adminApi.activateUser, onSuccess: invalidate })
  const deactivate = useMutation({ mutationFn: adminApi.deactivateUser, onSuccess: invalidate })

  const update = useMutation({
    mutationFn: () => adminApi.updateUser(editing!.id, editForm),
    onSuccess: () => {
      invalidate()
      setEditing(null)
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'Could not save changes.')),
  })

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: invalidate,
    onError: (err) => alert(apiErrorMessage(err, 'Could not delete this user.')),
  })

  const startEdit = (u: User) => {
    setEditing(u)
    setEditForm({ full_name: u.full_name, email: u.email || '' })
    setFormError('')
  }

  const handleDelete = (u: User) => {
    if (confirm(`Delete ${u.full_name || u.phone}? This can't be undone.`)) {
      remove.mutate(u.id)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-ink-500">Users</h1>

      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search phone, email, name..."
          className="rounded-lg border border-ink-100 px-3 py-2 text-sm w-64 outline-none focus:border-forest-400"
        />
        {ROLE_TABS.map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize ${
              role === r ? 'bg-forest-600 text-rice-50' : 'bg-rice-50 border border-ink-100 text-ink-400'
            }`}
          >
            {r ? r.replace('_', ' ') : 'All'}
          </button>
        ))}
      </div>

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs text-ink-300">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone / Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-300">Loading...</td>
              </tr>
            )}
            {data?.results.map((u) => (
              <tr key={u.id} className="border-b border-ink-100/60 last:border-0">
                <td className="px-4 py-3 font-medium text-ink-500">{u.full_name || '—'}</td>
                <td className="px-4 py-3 text-ink-400">
                  <div className="font-mono text-xs">{u.phone}</div>
                  {u.email && <div className="text-xs text-ink-300">{u.email}</div>}
                </td>
                <td className="px-4 py-3 text-ink-400 capitalize">{u.role.replace('_', ' ')}</td>
                <td className="px-4 py-3 text-xs text-ink-300">{formatDate(u.date_joined)}</td>
                <td className="px-4 py-3">
                  <Badge status={u.is_active ? 'active' : 'inactive'} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => setViewing(u)} className="text-ink-300 hover:text-forest-600" title="View">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={() => startEdit(u)} className="text-ink-300 hover:text-forest-600" title="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(u)} className="text-ink-300 hover:text-chili-500" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {u.is_active ? (
                      <Button size="sm" variant="danger" onClick={() => deactivate.mutate(u.id)} loading={deactivate.isPending}>
                        Deactivate
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => activate.mutate(u.id)} loading={activate.isPending}>
                        Activate
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {data && data.results.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-300">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="User details">
        {viewing && (
          <div className="flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between"><span className="text-ink-300">Name</span><span className="text-ink-500 font-medium">{viewing.full_name || '—'}</span></div>
            <div className="flex justify-between"><span className="text-ink-300">Phone</span><span className="text-ink-500 font-mono">{viewing.phone}</span></div>
            <div className="flex justify-between"><span className="text-ink-300">Email</span><span className="text-ink-500">{viewing.email || '—'}</span></div>
            <div className="flex justify-between"><span className="text-ink-300">Role</span><span className="text-ink-500 capitalize">{viewing.role.replace('_', ' ')}</span></div>
            <div className="flex justify-between"><span className="text-ink-300">Phone verified</span><Badge status={viewing.is_phone_verified ? 'active' : 'inactive'} label={viewing.is_phone_verified ? 'Yes' : 'No'} /></div>
            <div className="flex justify-between"><span className="text-ink-300">Email verified</span><Badge status={viewing.is_email_verified ? 'active' : 'inactive'} label={viewing.is_email_verified ? 'Yes' : 'No'} /></div>
            <div className="flex justify-between"><span className="text-ink-300">Status</span><Badge status={viewing.is_active ? 'active' : 'inactive'} /></div>
            <div className="flex justify-between"><span className="text-ink-300">Joined</span><span className="text-ink-500">{formatDate(viewing.date_joined)}</span></div>
          </div>
        )}
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit user">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            update.mutate()
          }}
          className="flex flex-col gap-3"
        >
          <Field label="Full name" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} autoFocus />
          <Field label="Email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          {formError && <p className="text-xs text-chili-600">{formError}</p>}
          <Button type="submit" loading={update.isPending} className="mt-2">
            Save changes
          </Button>
        </form>
      </Modal>
    </div>
  )
}
