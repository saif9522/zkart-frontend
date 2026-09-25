import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { apiErrorMessage } from '@/api/client'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'

export function EditProfilePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, updateUser } = useAuthStore()

  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (user) {
      setFullName(user.full_name ?? '')
      setEmail(user.email ?? '')
    }
  }, [user])

  const save = useMutation({
    mutationFn: () => authApi.updateProfile({ full_name: fullName, email }),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      setSuccess(true)
      setError('')
    },
    onError: (err) => setError(apiErrorMessage(err, 'Could not save your profile.')),
  })

  if (!user) {
    navigate('/login')
    return null
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="font-display text-xl font-semibold text-ink-500 mb-4">Edit profile</h1>

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink-400">Full name</span>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            className="rounded-xl border border-ink-100 bg-rice-100 px-3 py-2.5 text-sm outline-none focus:bg-rice-50 focus:border-forest-400 transition-colors"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink-400">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-xl border border-ink-100 bg-rice-100 px-3 py-2.5 text-sm outline-none focus:bg-rice-50 focus:border-forest-400 transition-colors"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink-400">Phone number</span>
          <input
            value={user.phone ?? ''}
            disabled
            className="rounded-xl border border-ink-100 bg-ink-100/30 px-3 py-2.5 text-sm text-ink-300 outline-none"
          />
          <span className="text-[11px] text-ink-300">Phone number can't be changed here.</span>
        </label>

        {error && <p className="text-xs text-chili-600">{error}</p>}
        {success && <p className="text-xs text-forest-600">Profile updated.</p>}

        <Button onClick={() => save.mutate()} loading={save.isPending} disabled={!fullName.trim()}>
          Save changes
        </Button>
      </div>
    </div>
  )
}
