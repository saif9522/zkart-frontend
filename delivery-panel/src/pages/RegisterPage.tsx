import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { deliveryApi } from '@/api/delivery'
import { apiErrorMessage } from '@/api/client'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { PasswordField } from '@/components/ui/PasswordField'

const RESEND_COOLDOWN = 30

export function RegisterPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)

  const [step, setStep] = useState<'details' | 'otp'>('details')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const normalizedPhone = phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown((s) => s - 1), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const validateDetails = () => {
    if (!fullName.trim()) return 'Please enter your name.'
    if (phone.replace(/\D/g, '').length !== 10) return 'Enter a valid 10-digit phone number.'
    if (password.length < 8) return 'Password must be at least 8 characters.'
    if (password !== confirmPassword) return "Passwords don't match."
    return ''
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    const validationError = validateDetails()
    if (validationError) {
      setError(validationError)
      return
    }
    setLoading(true)
    try {
      await authApi.sendSignupOtp(normalizedPhone)
      setStep('otp')
      setResendCooldown(RESEND_COOLDOWN)
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not send OTP. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setError('')
    setInfo('')
    try {
      await authApi.sendSignupOtp(normalizedPhone)
      setInfo('A new OTP has been sent.')
      setResendCooldown(RESEND_COOLDOWN)
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not resend OTP. Please try again.'))
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (otp.length < 4) {
      setError('Enter the OTP you received.')
      return
    }
    setLoading(true)
    try {
      const { user, tokens } = await authApi.verifySignupOtp({
        phone: normalizedPhone,
        code: otp,
        full_name: fullName,
        password,
      })
      setSession(user, tokens)

      // Brand new account — never has a delivery profile yet, so go straight to onboarding.
      try {
        await deliveryApi.profile()
        navigate('/')
      } catch {
        navigate('/onboard')
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'Invalid or expired OTP. Please try again.'))
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

        {step === 'details' ? (
          <form onSubmit={handleSendOtp} className="rounded-[var(--radius-card)] bg-rice-50 p-6 flex flex-col gap-4">
            <div>
              <h2 className="font-semibold text-ink-500">Create your delivery partner account</h2>
              <p className="text-sm text-ink-300 mt-1">We'll verify your phone number with an OTP before you can log in.</p>
            </div>
            <Field label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
            <Field
              label="Phone number"
              type="tel"
              inputMode="numeric"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <PasswordField
              label="Password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <PasswordField label="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            {error && <p className="text-xs text-chili-600">{error}</p>}
            <Button type="submit" loading={loading} className="w-full">
              Send OTP
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="rounded-[var(--radius-card)] bg-rice-50 p-6 flex flex-col gap-4">
            <div>
              <h2 className="font-semibold text-ink-500">Verify your phone</h2>
              <p className="text-sm text-ink-300 mt-1">Enter the OTP sent to {normalizedPhone}.</p>
            </div>
            <Field
              label="OTP"
              inputMode="numeric"
              placeholder="1234"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              autoFocus
            />
            {error && <p className="text-xs text-chili-600">{error}</p>}
            {info && <p className="text-xs text-forest-600">{info}</p>}
            <Button type="submit" loading={loading} className="w-full">
              Verify &amp; create account
            </Button>
            <div className="flex items-center justify-center gap-3 text-xs">
              <button type="button" onClick={() => setStep('details')} className="text-forest-600 hover:text-forest-700">
                Change details
              </button>
              <span className="text-ink-200">·</span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                className="text-forest-600 hover:text-forest-700 disabled:text-ink-300 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-xs text-rice-100/40 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-mango-500 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
