import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { apiErrorMessage } from '@/api/client'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import { EtaPill } from '@/components/ui/EtaPill'
import { PasswordField } from '@/components/ui/PasswordField'

export function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const setSession = useAuthStore((s) => s.setSession)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const normalizedPhone = phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (phone.replace(/\D/g, '').length !== 10) {
      setError('Enter a valid 10-digit phone number.')
      return
    }
    if (password.length < 8) {
      setError('Password kam se kam 8 characters ka hona chahiye.')
      return
    }
    if (password !== confirmPassword) {
      setError('Password match nahi kar raha.')
      return
    }
    setLoading(true)
    try {
      const { user, tokens } = await authApi.register(normalizedPhone, password, fullName, 'customer', referralCode || undefined)
      setSession(user, tokens)
      navigate('/')
    } catch (err) {
      setError(apiErrorMessage(err, 'Account nahi ban paya. Dubara try karein.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-1px)] flex flex-col items-center justify-center px-4 bg-rice-100">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="font-display text-2xl font-bold text-forest-700">zKart.shop</span>
          <div className="mt-3 flex justify-center">
            <EtaPill minutes={12} label="delivery" size="sm" />
          </div>
        </div>

        <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <h1 className="font-display text-xl font-semibold text-ink-500">Account banaye</h1>
              <p className="text-sm text-ink-300 mt-1">Sirf ek baar — phir seedha password se login.</p>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-ink-400">Full name</span>
              <input
                autoFocus
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Aapka naam"
                className="w-full rounded-xl border border-ink-100 bg-rice-100 px-3 py-2.5 text-sm outline-none focus:bg-rice-50 focus:border-forest-400 transition-colors"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-ink-400">Phone number</span>
              <div className="flex items-center rounded-xl border border-ink-100 bg-rice-100 focus-within:border-forest-400 focus-within:bg-rice-50 transition-colors">
                <span className="pl-3 pr-2 text-sm text-ink-300 font-mono">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="98765 43210"
                  className="w-full bg-transparent py-2.5 pr-3 text-sm outline-none"
                />
              </div>
            </label>

            <PasswordField
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Kam se kam 8 characters"
            />

            <PasswordField
              label="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Password dubara likhein"
            />

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-ink-400">Referral code (optional)</span>
              <input
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="Kisi doste ka code hai?"
                className="w-full rounded-xl border border-ink-100 bg-rice-100 px-3 py-2.5 text-sm outline-none focus:bg-rice-50 focus:border-forest-400 transition-colors"
              />
            </label>

            {error && <p className="text-xs text-chili-600">{error}</p>}

            <Button type="submit" loading={loading} className="w-full">
              Account banaye
            </Button>

            <p className="text-xs text-ink-300 text-center">
              Pehle se account hai?{' '}
              <Link to="/login" className="text-forest-600 font-semibold hover:text-forest-700">
                Log in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
