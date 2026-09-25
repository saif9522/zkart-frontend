import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { StorageWarning } from '@/components/layout/StorageWarning'
import { useAuthStore } from '@/store/auth'

export function Layout() {
  const user = useAuthStore((s) => s.user)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  // Close the phone menu whenever the page changes.
  useEffect(() => setMenuOpen(false), [location.pathname])
  // Don't let the page behind scroll while the menu is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <div className="min-h-screen flex bg-rice-100">
      <Sidebar />

      {/* Phone / tablet menu drawer */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <Sidebar variant="drawer" onNavigate={() => setMenuOpen(false)} />
          <button className="flex-1 bg-ink-500/50" onClick={() => setMenuOpen(false)} aria-label="Close menu" />
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute top-3 right-3 h-9 w-9 rounded-full bg-rice-50 text-ink-500 flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 bg-rice-50 border-b border-ink-100/60 px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setMenuOpen(true)}
              className="h-9 w-9 rounded-lg border border-ink-100 flex items-center justify-center text-ink-500"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-bold text-sm text-ink-500">
              zKart.shop · {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </span>
          </div>
          <span className="hidden lg:block" />
          <NotificationBell />
        </header>
        <StorageWarning />
        <main className="p-3 sm:p-6 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
