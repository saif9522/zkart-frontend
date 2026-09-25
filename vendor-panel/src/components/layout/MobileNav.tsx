import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/components/layout/navItems'

/** Bottom tab bar for phones — most vendors run their shop from a phone, not a laptop. */
export function MobileNav({ newOrderCount = 0 }: { newOrderCount?: number }) {
  const items = NAV_ITEMS.filter((i) => i.to !== '/settings')
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-rice-50 border-t border-ink-100 grid"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {items.map(({ to, short, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium',
              isActive ? 'text-forest-600' : 'text-ink-300'
            )
          }
        >
          <Icon className="h-5 w-5" />
          {short}
          {to === '/orders' && newOrderCount > 0 && (
            <span className="absolute top-1 right-1/2 translate-x-4 rounded-full bg-chili-500 text-rice-50 text-[10px] font-bold px-1.5 min-w-4 text-center animate-pulse">
              {newOrderCount}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
