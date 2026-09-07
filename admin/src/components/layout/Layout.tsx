import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { useAuthStore } from '@/store/auth'

export function Layout() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="min-h-screen flex bg-rice-100">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 bg-rice-50 border-b border-ink-100/60 px-4 py-2.5 flex items-center justify-between">
          <span className="font-bold text-sm text-ink-500 lg:hidden">
            zKart.shop · {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
          </span>
          <span className="hidden lg:block" />
          <NotificationBell />
        </header>
        <main className="p-4 sm:p-6 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
