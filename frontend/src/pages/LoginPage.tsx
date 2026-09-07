import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { apiErrorMessage } from '@/api/client'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import { EtaPill } from '@/components/ui/EtaPill'
import { GoogleLoginButton } from '@/components/ui/GoogleLoginButton'
import { PasswordField } from '@/components/ui/PasswordField'

const RESEND_COOLDOWN = 30

export function LoginPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)

  const [mode, setMode] = useState<'password' | 'otp'>('password')
  const [otpStep, setOtpStep] = useState<'phone' | 'code'>('phone')

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const normalizedPhone = phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown((s) => s - 1), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const switchMode = (next: 'password' | 'otp') => {
    setMode(next)
    setOtpStep('phone')
    setCode('')
    setError('')
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (phone.replace(/\D/g, '').length !== 10) {
      setError('Enter a valid 10-digit phone number.')
      return
    }
    setLoading(true)
    try {
      const { user, tokens } = await authApi.loginWithPassword(normalizedPhone, password)
      setSession(user, tokens)
      navigate('/')
    } catch (err) {
      setError(apiErrorMessage(err, 'Incorrect phone number or password.'))
    } finally {
      setLoading(false)
    }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (phone.replace(/\D/g, '').length !== 10) {
      setError('Enter a valid 10-digit phone number.')
      return
    }
    setLoading(true)
    try {
      // 'login' purpose works for both an existing account and a brand-new one —
      // VerifyOTPSerializer creates the customer account on first use if needed.
      await authApi.sendOtp(normalizedPhone, 'login')
      setOtpStep('code')
      setResendCooldown(RESEND_COOLDOWN)
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not send code. Try again.'))
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setError('')
    try {
      await authApi.sendOtp(normalizedPhone, 'login')
      setResendCooldown(RESEND_COOLDOWN)
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not resend code. Try again.'))
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (code.length !== 6) {
      setError('Enter the 6-digit code.')
      return
    }
    setLoading(true)
    try {
      const { user, tokens } = await authApi.verifyOtp(normalizedPhone, code, undefined, 'login')
      setSession(user, tokens)
      navigate('/')
    } catch (err) {
      setError(apiErrorMessage(err, 'Invalid or expired code.'))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleCredential = async (idToken: string) => {
    setError('')
    setLoading(true)
    try {
      const { user, tokens } = await authApi.googleLogin(idToken)
      setSession(user, tokens)
      navigate('/')
    } catch (err) {
      setError(apiErrorMessage(err, 'Google login failed. Try again.'))
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
          <div>
            <h1 className="font-display text-xl font-semibold text-ink-500">Log in</h1>
            <p className="text-sm text-ink-300 mt-1">Apne phone number se login karein.</p>
          </div>

          <div className="mt-4 flex rounded-xl bg-rice-100 p-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => switchMode('password')}
              className={`flex-1 rounded-lg py-1.5 transition-colors ${
                mode === 'password' ? 'bg-rice-50 text-forest-700 shadow-sm' : 'text-ink-300'
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => switchMode('otp')}
              className={`flex-1 rounded-lg py-1.5 transition-colors ${
                mode === 'otp' ? 'bg-rice-50 text-forest-700 shadow-sm' : 'text-ink-300'
              }`}
            >
              OTP
            </button>
          </div>

          {mode === 'password' ? (
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4 mt-4">
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

              <PasswordField
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />

              <Link to="/forgot-password" className="text-xs text-forest-600 hover:text-forest-700 -mt-2 self-end">
                Password bhool gaye?
              </Link>

              {error && <p className="text-xs text-chili-600">{error}</p>}

              <Button type="submit" loading={loading} className="w-full">
                Log in
              </Button>
            </form>
          ) : otpStep === 'phone' ? (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-4 mt-4">
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
              <p className="text-xs text-ink-300 text-center">Naya number ho to account apne aap ban jayega.</p>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4 mt-4">
              <p className="text-sm text-ink-300">
                Code bheja gaya <span className="font-mono text-ink-500">+91 {phone}</span> par
              </p>
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

              {error && <p className="text-xs text-chili-600">{error}</p>}

              <Button type="submit" loading={loading} className="w-full">
                Verify &amp; log in
              </Button>
              <div className="flex items-center justify-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setOtpStep('phone')}
                  className="text-ink-300 hover:text-forest-600"
                >
                  Phone number badle
                </button>
                <span className="text-ink-200">·</span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0}
                  className="text-forest-600 hover:text-forest-700 disabled:text-ink-300 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Code dobara bhejein (${resendCooldown}s)` : 'Code dobara bhejein'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-ink-100" />
            <span className="text-xs text-ink-300">ya</span>
            <div className="h-px flex-1 bg-ink-100" />
          </div>
          <div className="mt-4">
            <GoogleLoginButton onCredential={handleGoogleCredential} />
          </div>

          <p className="text-xs text-ink-300 text-center mt-4">
            Naye ho?{' '}
            <Link to="/register" className="text-forest-600 font-semibold hover:text-forest-700">
              Account banaye
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
