import { NavLink } from 'react-router-dom'
import { Home, ListOrdered, ShoppingCart, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'

const items = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/orders', label: 'Orders', icon: ListOrdered },
  { to: '/cart', label: 'Cart', icon: ShoppingCart },
  { to: '/account', label: 'Account', icon: User },
]

export function BottomNav() {
  const { cart } = useCart()

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-rice-50 border-t border-ink-100 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center gap-0.5 py-2.5 px-4 text-[11px] font-medium',
                isActive ? 'text-forest-600' : 'text-ink-300'
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
            {to === '/cart' && !!cart?.item_count && (
              <span className="absolute top-1 right-2.5 h-4 w-4 rounded-full bg-mango-500 text-forest-900 text-[9px] font-bold font-mono flex items-center justify-center">
                {cart.item_count}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
