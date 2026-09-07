import { NavLink, useNavigate } from 'react-router-dom'
import {
  Activity,
  Award,
  Boxes,
  Building2,
  Coins,
  ClipboardList,
  CreditCard,
  Database,
  FileText,
  FolderOpen,
  Megaphone,
  GalleryHorizontal,
  Gift,
  HelpCircle,
  Image,
  LayoutDashboard,
  LayoutList,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Newspaper,
  Package,
  ShoppingBasket,
  ScrollText,
  Settings,
  ShieldCheck,
  Tag,
  Truck,
  Users,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { authApi } from '@/api/auth'

const ADMIN_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/vendors', label: 'Vendors', icon: Building2 },
  { to: '/delivery-partners', label: 'Delivery Partners', icon: Truck },
  { to: '/orders', label: 'Orders', icon: Package },
  { to: '/products', label: 'Products', icon: ShoppingBasket },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/accounting', label: 'Accounting', icon: Wallet },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/coupons', label: 'Coupons', icon: Tag },
  { to: '/categories', label: 'Categories', icon: ClipboardList },
  { to: '/brands', label: 'Brands', icon: Award },
  { to: '/reviews', label: 'Reviews', icon: MessageSquare },
  { to: '/sliders', label: 'Sliders', icon: GalleryHorizontal },
  { to: '/banners', label: 'Banners', icon: Image },
  { to: '/offers', label: 'Offers', icon: Gift },
  { to: '/faqs', label: 'FAQs', icon: HelpCircle },
  { to: '/pages', label: 'Pages', icon: FileText },
  { to: '/blog', label: 'Blog', icon: Newspaper },
  { to: '/footer-links', label: 'Footer Links', icon: LayoutList },
  { to: '/contact-messages', label: 'Contact Messages', icon: Mail },
  { to: '/payment-methods', label: 'Payment Methods', icon: CreditCard },
  { to: '/extra-charges', label: 'Extra Charges', icon: Coins },
  { to: '/media-library', label: 'Media Library', icon: FolderOpen },
  { to: '/campaigns', label: 'Campaigns', icon: Megaphone },
]

const SUPER_ADMIN_ITEMS = [
  { to: '/cities', label: 'Cities', icon: MapPin },
  { to: '/settings', label: 'Platform Settings', icon: Settings },
  { to: '/staff', label: 'Staff & RBAC', icon: ShieldCheck },
  { to: '/logs', label: 'Audit Logs', icon: ScrollText },
  { to: '/backups', label: 'Backups', icon: Database },
  { to: '/monitoring', label: 'API Monitoring', icon: Activity },
]

export function Sidebar() {
  const { user, refreshToken, logout } = useAuthStore()
  const navigate = useNavigate()
  const isSuperAdmin = user?.role === 'super_admin'

  const handleLogout = async () => {
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken)
      } catch {
        // ignore — logging out locally regardless
      }
    }
    logout()
    navigate('/login')
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-surface-900 text-rice-100 h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-surface-700 flex items-center gap-2.5">
        <img src="/icons/icon-192.png" alt="" className="h-8 w-8 rounded-lg shrink-0" />
        <div>
          <p className="font-bold text-rice-50">zKart.shop</p>
          <p className="text-xs text-rice-100/50 mt-0.5">
            {isSuperAdmin ? 'Super Admin' : 'Admin'} Console
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 flex flex-col gap-0.5 px-3">
        {ADMIN_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-forest-600 text-rice-50' : 'text-rice-100/70 hover:bg-surface-800 hover:text-rice-50'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}

        {isSuperAdmin && (
          <>
            <p className="text-[10px] uppercase tracking-wider text-rice-100/40 font-semibold px-3 mt-4 mb-1">
              Super Admin
            </p>
            {SUPER_ADMIN_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-mango-500 text-forest-900' : 'text-rice-100/70 hover:bg-surface-800 hover:text-rice-50'
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-surface-700">
        <div className="px-3 mb-2">
          <p className="text-sm font-medium text-rice-50 truncate">{user?.full_name || 'Staff'}</p>
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
