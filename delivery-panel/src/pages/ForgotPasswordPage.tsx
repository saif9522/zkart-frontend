import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { apiErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
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
      await authApi.sendResetOtp(normalizedPhone)
      setStep('reset')
      setResendCooldown(RESEND_COOLDOWN)
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not send code. Try again.'))
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setError('')
    setSuccess('')
    try {
      await authApi.sendResetOtp(normalizedPhone)
      setSuccess('A new code has been sent.')
      setResendCooldown(RESEND_COOLDOWN)
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not resend code. Try again.'))
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (code.length !== 6) {
      setError('Enter the 6-digit code.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      await authApi.resetPassword(normalizedPhone, code, newPassword)
      setSuccess('Password updated. You can now log in.')
      setTimeout(() => navigate('/login'), 1800)
    } catch (err) {
      setError(apiErrorMessage(err, 'Invalid or expired code.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-surface-900">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/icons/icon-192.png" alt="" className="h-12 w-12 rounded-2xl mx-auto" />
          <h1 className="font-bold text-xl text-rice-50 mt-3">zKart.shop</h1>
          <p className="text-sm text-rice-100/50">Delivery Partner</p>
        </div>

        <div className="rounded-[var(--radius-card)] bg-rice-50 p-6">
          {step === 'phone' ? (
            <form onSubmit={handleSendCode} className="flex flex-col gap-4">
              <div>
                <h2 className="font-semibold text-ink-500">Reset password</h2>
                <p className="text-sm text-ink-300 mt-1">We'll send a code to your registered phone.</p>
              </div>
              <Field
                label="Phone number"
                type="tel"
                inputMode="numeric"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/(?!^\+)\D/g, ''))}
                autoFocus
              />
              {error && <p className="text-xs text-chili-600">{error}</p>}
              <Button type="submit" loading={loading} className="w-full">
                Send code
              </Button>
              <Link to="/login" className="text-xs text-ink-300 hover:text-forest-600 text-center">
                Back to login
              </Link>
            </form>
          ) : (
            <form onSubmit={handleReset} className="flex flex-col gap-4">
              <div>
                <h2 className="font-semibold text-ink-500">Enter code</h2>
                <p className="text-sm text-ink-300 mt-1">
                  Code sent to <span className="font-mono text-ink-500">{normalizedPhone}</span>
                </p>
              </div>
              <Field
                label="6-digit code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                autoFocus
              />
              <PasswordField
                label="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
              {error && <p className="text-xs text-chili-600">{error}</p>}
              {success && <p className="text-xs text-forest-600">{success}</p>}
              <Button type="submit" loading={loading} className="w-full">
                Update password
              </Button>
              <div className="flex items-center justify-center gap-3 text-xs">
                <button type="button" onClick={() => setStep('phone')} className="text-ink-300 hover:text-forest-600">
                  Change phone number
                </button>
                <span className="text-ink-200">·</span>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0}
                  className="text-forest-600 hover:text-forest-700 disabled:text-ink-300 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
