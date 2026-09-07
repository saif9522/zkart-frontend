import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { apiErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { EtaPill } from '@/components/ui/EtaPill'
import { PasswordField } from '@/components/ui/PasswordField'

const RESEND_COOLDOWN = 30

export function ForgotPasswordPage() {
  const navigate = useNavigate()

  const [step, setStep] = useState<'phone' | 'reset'>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const normalizedPhone = phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown((s) => s - 1), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (phone.replace(/\D/g, '').length !== 10) {
      setError('Enter a valid 10-digit phone number.')
      return
    }
    setLoading(true)
    try {
      await authApi.sendOtp(normalizedPhone, 'reset_password')
      setStep('reset')
      setResendCooldown(RESEND_COOLDOWN)
    } catch (err) {
      setError(apiErrorMessage(err, 'Code nahi bhej paye. Dubara try karein.'))
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setError('')
    setSuccess('')
    try {
      await authApi.sendOtp(normalizedPhone, 'reset_password')
      setSuccess('Naya code bhej diya gaya hai.')
      setResendCooldown(RESEND_COOLDOWN)
    } catch (err) {
      setError(apiErrorMessage(err, 'Code nahi bhej paye. Dubara try karein.'))
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (code.length !== 6) {
      setError('6-digit code daalein.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password kam se kam 8 characters ka hona chahiye.')
      return
    }
    setLoading(true)
    try {
      await authApi.resetPassword(normalizedPhone, code, newPassword)
      setSuccess('Password badal gaya! Ab naye password se login karein.')
      setTimeout(() => navigate('/login'), 1800)
    } catch (err) {
      setError(apiErrorMessage(err, 'Code galat hai ya expire ho gaya hai.'))
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
          {step === 'phone' ? (
            <form onSubmit={handleSendCode} className="flex flex-col gap-4">
              <div>
                <h1 className="font-display text-xl font-semibold text-ink-500">Password reset karein</h1>
                <p className="text-sm text-ink-300 mt-1">Aapke phone par ek code bhejenge.</p>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink-400">Phone number</span>
                <div className="flex items-center rounded-xl border border-ink-100 bg-rice-100 focus-within:border-forest-400 focus-within:bg-rice-50 transition-colors">
                  <span className="pl-3 pr-2 text-sm text-ink-300 font-mono">+91</span>
                  <input
                    autoFocus
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
              {error && <p className="text-xs text-chili-600">{error}</p>}
              <Button type="submit" loading={loading} className="w-full">
                Code bhejein
              </Button>
              <Link to="/login" className="text-xs text-ink-300 hover:text-forest-600 text-center">
                Login par wapas jaye
              </Link>
            </form>
          ) : (
            <form onSubmit={handleReset} className="flex flex-col gap-4">
              <div>
                <h1 className="font-display text-xl font-semibold text-ink-500">Naya password banaye</h1>
                <p className="text-sm text-ink-300 mt-1">
                  Code bheja gaya <span className="font-mono text-ink-500">+91 {phone}</span> par
                </p>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink-400">6-digit code</span>
                <input
                  autoFocus
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full rounded-xl border border-ink-100 bg-rice-100 px-3 py-2.5 text-sm font-mono tracking-[0.3em] outline-none focus:bg-rice-50 focus:border-forest-400 transition-colors"
                />
              </label>
              <PasswordField
                label="Naya password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Kam se kam 8 characters"
              />
              {error && <p className="text-xs text-chili-600">{error}</p>}
              {success && <p className="text-xs text-forest-600">{success}</p>}
              <Button type="submit" loading={loading} className="w-full">
                Password badle
              </Button>
              <div className="flex items-center justify-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-ink-300 hover:text-forest-600"
                >
                  Phone number badle
                </button>
                <span className="text-ink-200">·</span>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0}
                  className="text-forest-600 hover:text-forest-700 disabled:text-ink-300 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Code dobara bhejein (${resendCooldown}s)` : 'Code dobara bhejein'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
