import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { deliveryApi } from '@/api/delivery'
import { apiErrorMessage } from '@/api/client'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { PasswordField } from '@/components/ui/PasswordField'

export function LoginPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const normalizedPhone = phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`
      const { user, tokens } = await authApi.login(normalizedPhone, password)

      if (user.role !== 'delivery') {
        setError('This account does not have delivery partner access.')
        return
      }

      setSession(user, tokens)

      try {
        await deliveryApi.profile()
        navigate('/')
      } catch {
        // Not registered as a partner yet — send them to onboarding instead of a dashboard that 404s.
        navigate('/onboard')
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'Invalid phone number or password.'))
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

        <form onSubmit={handleSubmit} className="rounded-[var(--radius-card)] bg-rice-50 p-6 flex flex-col gap-4">
          <Field
            label="Phone number"
            type="tel"
            inputMode="numeric"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoFocus
          />
          <PasswordField
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Link to="/forgot-password" className="text-xs text-forest-600 hover:text-forest-700 -mt-2 self-end">
            Forgot password?
          </Link>
          {error && <p className="text-xs text-chili-600">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">
            Log in
          </Button>
        </form>

        <p className="text-center text-xs text-rice-100/40 mt-4">
          Only delivery partner accounts can log in here.
          <br />
          New here?{' '}
          <Link to="/register" className="text-mango-500 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
