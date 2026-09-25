import { useNavigate, Link } from 'react-router-dom'
import { Bell, Heart, LogOut, MapPin, Package, User as UserIcon, Wallet } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { authApi } from '@/api/auth'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export function AccountPage() {
  const navigate = useNavigate()
  const { user, refreshToken, logout } = useAuthStore()
  const push = usePushNotifications()

  if (!user) {
    navigate('/login')
    return null
  }

  const handleLogout = async () => {
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken)
      } catch {
        // token may already be expired — logging out locally regardless
      }
    }
    logout()
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-14 w-14 rounded-full bg-forest-600 text-rice-50 flex items-center justify-center font-display text-xl font-semibold">
          {user.full_name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <h1 className="font-display text-lg font-semibold text-ink-500">{user.full_name || 'Welcome'}</h1>
          <p className="text-sm text-ink-300 font-mono">{user.phone}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Link
          to="/orders"
          className="flex items-center gap-3 rounded-xl bg-rice-50 border border-ink-100/60 p-4 text-sm font-medium text-ink-500"
        >
          <Package className="h-5 w-5 text-forest-600" /> Your orders
        </Link>
        <Link
          to="/wishlist"
          className="flex items-center gap-3 rounded-xl bg-rice-50 border border-ink-100/60 p-4 text-sm font-medium text-ink-500"
        >
          <Heart className="h-5 w-5 text-forest-600" /> Your wishlist
        </Link>
        <Link
          to="/wallet"
          className="flex items-center gap-3 rounded-xl bg-rice-50 border border-ink-100/60 p-4 text-sm font-medium text-ink-500"
        >
          <Wallet className="h-5 w-5 text-forest-600" /> Wallet &amp; referrals
        </Link>
        {push.supported && (
          <button
            onClick={() => (push.status === 'subscribed' ? push.unsubscribe() : push.subscribe())}
            disabled={push.loading || push.status === 'denied'}
            className="flex items-center justify-between gap-3 rounded-xl bg-rice-50 border border-ink-100/60 p-4 text-sm font-medium text-ink-500 disabled:opacity-60 w-full text-left"
          >
            <span className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-forest-600" /> Push notifications
            </span>
            <span className="text-xs text-ink-300">
              {push.status === 'subscribed'
                ? 'On — tap to turn off'
                : push.status === 'denied'
                  ? 'Blocked in browser settings'
                  : push.loading
                    ? '...'
                    : 'Off — tap to turn on'}
            </span>
          </button>
        )}
        <Link
          to="/account/addresses"
          className="flex items-center gap-3 rounded-xl bg-rice-50 border border-ink-100/60 p-4 text-sm font-medium text-ink-500"
        >
          <MapPin className="h-5 w-5 text-forest-600" /> Saved addresses
        </Link>
        <Link
          to="/account/edit-profile"
          className="flex items-center gap-3 rounded-xl bg-rice-50 border border-ink-100/60 p-4 text-sm font-medium text-ink-500"
        >
          <UserIcon className="h-5 w-5 text-forest-600" /> Edit profile
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-xl bg-rice-50 border border-ink-100/60 p-4 text-sm font-medium text-chili-600 mt-2"
        >
          <LogOut className="h-5 w-5" /> Log out
        </button>
      </div>
    </div>
  )
}
