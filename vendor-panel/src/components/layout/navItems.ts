import { Boxes, IndianRupee, LayoutDashboard, Package, Settings, ShoppingBag } from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', short: 'Home', icon: LayoutDashboard },
  { to: '/orders', label: 'Orders', short: 'Orders', icon: ShoppingBag },
  { to: '/products', label: 'Products', short: 'Products', icon: Package },
  { to: '/inventory', label: 'Inventory', short: 'Stock', icon: Boxes },
  { to: '/earnings', label: 'Earnings', short: 'Earnings', icon: IndianRupee },
  { to: '/settings', label: 'Shop settings', short: 'Settings', icon: Settings },
]
