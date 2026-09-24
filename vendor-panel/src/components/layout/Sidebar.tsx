import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/components/layout/navItems'

export function Sidebar({ newOrderCount = 0 }: { newOrderCount?: number }) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="hidden lg:flex w-60 shrink-0 bg-surface-900 flex-col h-screen sticky top-0">
      <div className="px-4 py-5 flex items-center gap-2.5 border-b border-surface-700">
        <img src="/icons/icon-192.png" alt="" className="h-8 w-8 rounded-lg shrink-0" />
        <div>
          <p className="text-sm font-bold text-rice-50 leading-tight">zKart.shop</p>
          <p className="text-xs text-rice-100/50 leading-tight">Vendor Panel</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-forest-600 text-rice-50' : 'text-rice-100/70 hover:bg-surface-800 hover:text-rice-50'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
            {to === '/orders' && newOrderCount > 0 && (
              <span className="ml-auto rounded-full bg-mango-500 text-forest-900 text-[11px] font-bold px-1.5 min-w-5 text-center">
                {newOrderCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-surface-700">
        <div className="px-3 mb-2">
          <p className="text-sm font-medium text-rice-50 truncate">{user?.full_name || 'Vendor'}</p>
          <p className="text-xs text-rice-100/50 font-mono">{user?.phone}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-rice-100/70 hover:bg-surface-800 hover:text-chili-500 transition-colors"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    </aside>
  )
}
