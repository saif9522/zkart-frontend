import { Link, Outlet } from 'react-router-dom'
import { BellRing, Settings } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { useNewOrderAlert } from '@/hooks/useNewOrderAlert'

export function Layout() {
  const { newCount, soundOn, enableSound } = useNewOrderAlert()

  return (
    <div className="min-h-screen flex bg-rice-100">
      <Sidebar newOrderCount={newCount} />
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 bg-rice-50 border-b border-ink-100/60 px-4 py-2.5 flex items-center justify-between gap-2">
          <span className="font-bold text-sm text-ink-500 lg:hidden">zKart.shop · Vendor</span>
          <span className="hidden lg:block" />
          <div className="flex items-center gap-2">
            {!soundOn && (
              <button
                onClick={enableSound}
                className="flex items-center gap-1.5 rounded-lg bg-mango-100 text-mango-600 px-2.5 py-1.5 text-xs font-semibold"
              >
                <BellRing className="h-3.5 w-3.5" /> Turn on order sound
              </button>
            )}
            <Link to="/settings" className="lg:hidden text-ink-300 p-1" aria-label="Shop settings">
              <Settings className="h-5 w-5" />
            </Link>
            <NotificationBell />
          </div>
        </header>
        {newCount > 0 && (
          <Link
            to="/orders"
            className="block bg-mango-500 text-forest-900 text-sm font-semibold text-center py-2 animate-pulse"
          >
            🔔 {newCount} new order{newCount > 1 ? 's' : ''} waiting — tap to accept
          </Link>
        )}
        <main className="p-4 sm:p-6 max-w-7xl mx-auto pb-24 lg:pb-6">
          <Outlet />
        </main>
      </div>
      <MobileNav newOrderCount={newCount} />
    </div>
  )
}
