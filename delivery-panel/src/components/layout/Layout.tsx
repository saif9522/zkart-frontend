import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BellRing, LogOut } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { NAV_ITEMS } from '@/components/layout/navItems'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { useNewDeliveryAlert } from '@/hooks/useNewDeliveryAlert'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

export function Layout() {
  const { newCount, soundOn, enableSound } = useNewDeliveryAlert()
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex bg-rice-100">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 bg-rice-50 border-b border-ink-100/60 px-4 py-2.5 flex items-center justify-between gap-2">
          <span className="font-bold text-sm text-ink-500 lg:hidden">zKart.shop · Delivery</span>
          <span className="hidden lg:block" />
          <div className="flex items-center gap-2">
            {!soundOn && (
              <button
                onClick={enableSound}
                className="flex items-center gap-1.5 rounded-lg bg-mango-100 text-mango-600 px-2.5 py-1.5 text-xs font-semibold"
              >
                <BellRing className="h-3.5 w-3.5" /> Order sound on
              </button>
            )}
            <NotificationBell />
            <button
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="lg:hidden text-ink-300 p-1"
              aria-label="Log out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>
        {newCount > 0 && (
          <Link to="/orders" className="block bg-mango-500 text-forest-900 text-sm font-semibold text-center py-2 animate-pulse">
            🛵 {newCount} deliver{newCount > 1 ? 'ies' : 'y'} ready for pickup — tap to claim
          </Link>
        )}
        <main className="p-4 sm:p-6 max-w-7xl mx-auto pb-24 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Riders use phones — bottom tab bar instead of a desktop sidebar */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-rice-50 border-t border-ink-100 grid grid-cols-3"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn('relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium', isActive ? 'text-forest-600' : 'text-ink-300')
            }
          >
            <Icon className="h-5 w-5" />
            {label}
            {to === '/orders' && newCount > 0 && (
              <span className="absolute top-1 right-1/2 translate-x-4 rounded-full bg-chili-500 text-rice-50 text-[10px] font-bold px-1.5 min-w-4 text-center">
                {newCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
