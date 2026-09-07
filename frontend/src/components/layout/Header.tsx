import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, MapPin, Search, ShoppingCart, User as UserIcon, Zap } from 'lucide-react'
import { useState } from 'react'
import { useCart } from '@/hooks/useCart'
import { useAuthStore } from '@/store/auth'

export function Header() {
  const { cart } = useCart()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const user = useAuthStore((s) => s.user)
  const isAuthed = !!useAuthStore((s) => s.accessToken)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="sticky top-0 z-30 bg-rice-50/95 backdrop-blur border-b border-ink-100/60">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4 sm:gap-6">
        {/* Logo + delivery-promise / location, stacked — Zepto-style left block */}
        <Link to="/" className="flex flex-col shrink-0">
          <span className="font-display text-xl font-bold text-forest-700 leading-none flex items-center gap-1.5">
            <img src="/icons/icon-192.png" alt="" className="h-6 w-6 rounded-md" />
            zKart.shop
          </span>
          <span className="hidden sm:flex items-center gap-2.5 text-xs text-ink-300 mt-1">
            <span className="flex items-center gap-0.5 font-semibold text-forest-700">
              <Zap className="h-3 w-3 fill-forest-700" /> Delivery in minutes*
            </span>
            <span className="flex items-center gap-0.5">
              Select Location <ChevronDown className="h-3 w-3" />
            </span>
          </span>
        </Link>

        {/* Search — takes the middle space, Zepto-style */}
        <form onSubmit={handleSearch} className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder='Search for "milk"'
            className="w-full rounded-xl border border-ink-100 bg-rice-100 py-2.5 pl-10 pr-4 text-sm placeholder:text-ink-300 focus:bg-rice-50 focus:border-forest-400 outline-none transition-colors"
          />
        </form>

        {/* Login/Account + Cart — right side, icon-over-label like Zepto */}
        <div className="flex items-center gap-4 sm:gap-5 shrink-0">
          <Link
            to={isAuthed ? '/account' : '/login'}
            className="hidden sm:flex flex-col items-center gap-0.5 text-ink-400 hover:text-forest-600"
          >
            <UserIcon className="h-5 w-5" />
            <span className="text-xs font-medium">{isAuthed ? (user?.full_name?.split(' ')[0] || 'Account') : 'Login'}</span>
          </Link>

          <Link to="/cart" className="relative flex flex-col items-center gap-0.5 text-ink-400 hover:text-forest-600">
            <ShoppingCart className="h-5 w-5" />
            <span className="text-xs font-medium">Cart</span>
            {!!cart?.item_count && (
              <span className="absolute -top-1.5 -right-2 flex h-[18px] w-[18px] min-w-[18px] items-center justify-center rounded-full bg-mango-500 text-forest-900 text-[10px] font-bold font-mono px-0.5">
                {cart.item_count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile-only compact delivery/location row (desktop shows it under the logo instead) */}
      <div className="sm:hidden flex items-center gap-2.5 px-4 pb-2.5 text-xs text-ink-300">
        <span className="flex items-center gap-0.5 font-semibold text-forest-700">
          <Zap className="h-3 w-3 fill-forest-700" /> Delivery in minutes*
        </span>
        <span className="flex items-center gap-0.5">
          <MapPin className="h-3 w-3" /> Garhwa <ChevronDown className="h-3 w-3" />
        </span>
      </div>
    </header>
  )
}
