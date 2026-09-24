import { Link } from 'react-router-dom'
import { AtSign, Globe, MessageCircle, QrCode, Share2, ShoppingBag, Smartphone, Zap } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cmsApi } from '@/api/cms'
import type { FooterLink } from '@/api/cms'

const HOW_IT_WORKS = [
  { icon: Smartphone, title: 'Open the app', desc: 'Choose from hundreds of products across groceries, fresh fruits & veggies, beauty items & more' },
  { icon: ShoppingBag, title: 'Place an order', desc: 'Add your favourite items to the cart & avail the best offers' },
  { icon: Zap, title: 'Get fast delivery', desc: 'Experience lightning-fast speed & get all your items delivered in minutes' },
]

const TRENDING = {
  Categories: ['Ice Creams', 'Cold Beverages', 'Snacks', 'Personal Care', 'Baby Care', 'Cleaning Essentials'],
  Products: ['Milk', 'Bread', 'Eggs', 'Rice', 'Cooking Oil', 'Atta', 'Detergent'],
  Brands: ['Amul', 'Tata', 'Nestle', 'ITC', 'HUL', 'Britannia'],
}

const POPULAR = {
  Products: ['Onion', 'Potato', 'Tomato', 'Lemon', 'Ginger', 'Garlic', 'Green Chilli', 'Coriander'],
  Brands: ['Fortune', 'Maggi', 'Parle', 'Dabur', 'Colgate', 'Surf Excel'],
  Categories: ['Grocery', 'Fruits & Vegetables', 'Dairy', 'Bakery', 'Medicines', 'Chips'],
}

const CATEGORIES = [
  'Fruits & Vegetables', 'Grocery', 'Masala & Dry Fruits', 'Sweet Cravings', 'Frozen Food & Ice Creams',
  'Dairy, Bread & Eggs', 'Cold Drinks & Juices', 'Snacks', 'Meats, Fish & Eggs',
  'Breakfast & Sauces', 'Biscuits', 'Makeup & Beauty', 'Bath & Body',
  'Cleaning Essentials', 'Home Needs', 'Electricals & Accessories', 'Hygiene & Grooming',
]

const CITIES = ['Garhwa', 'Palamu']

function LinkRow({ label, items }: { label: string; items: string[] }) {
  return (
    <p className="text-sm text-ink-300 leading-relaxed">
      <span className="font-semibold text-ink-500">{label}</span>
      <span className="mx-1.5">:</span>
      {items.join(' | ')}
    </p>
  )
}

function CmsLinkItem({ link }: { link: FooterLink }) {
  const className = 'text-sm text-rice-200 hover:text-rice-50 transition-colors'
  return link.url.startsWith('http') ? (
    <a href={link.url} target="_blank" rel="noopener noreferrer" className={className}>
      {link.label}
    </a>
  ) : (
    <Link to={link.url} className={className}>
      {link.label}
    </Link>
  )
}

export function Footer() {
  const { data: cmsLinks } = useQuery({ queryKey: ['footer-links'], queryFn: cmsApi.footerLinks })

  const cmsSections = cmsLinks
    ? (['about', 'quick_links', 'customer_support', 'social'] as const)
        .map((section) => ({ section, items: cmsLinks.filter((l) => l.section === section) }))
        .filter((s) => s.items.length > 0)
    : []

  return (
    <footer className="mt-12 bg-rice-50 border-t border-ink-100/60">
      {/* How it Works */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <h2 className="font-display text-xl font-bold text-ink-500 text-center mb-6">How it Works</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {HOW_IT_WORKS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-[var(--radius-card)] border border-ink-100/60 bg-white p-6 text-center flex flex-col items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-forest-50 flex items-center justify-center">
                <Icon className="h-7 w-7 text-forest-600" />
              </div>
              <h3 className="font-semibold text-ink-500">{title}</h3>
              <p className="text-sm text-ink-300 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trending / Popular searches + Categories — SEO-style link lists */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 border-t border-ink-100/60 flex flex-col gap-6">
        <div>
          <h3 className="font-display font-bold text-ink-500 mb-2">Trending Searches</h3>
          <div className="flex flex-col gap-1">
            {Object.entries(TRENDING).map(([label, items]) => (
              <LinkRow key={label} label={label} items={items} />
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-display font-bold text-ink-500 mb-2">Popular Searches</h3>
          <div className="flex flex-col gap-1">
            {Object.entries(POPULAR).map(([label, items]) => (
              <LinkRow key={label} label={label} items={items} />
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-display font-bold text-ink-500 mb-3">Categories</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2">
            {CATEGORIES.map((c) => (
              <Link
                key={c}
                to={`/search?category=${encodeURIComponent(c.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-'))}`}
                className="text-sm text-ink-300 hover:text-forest-600 transition-colors"
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Cities we serve — only where we actually operate */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 border-t border-ink-100/60">
        <h3 className="font-display font-bold text-ink-500 mb-2">Cities</h3>
        <p className="text-sm text-ink-300">{CITIES.join(' | ')}</p>
      </div>

      {/* Main footer — brand, CMS-managed link columns, download app, copyright */}
      <div className="bg-forest-900 text-rice-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1 flex flex-col gap-3">
            <span className="font-display text-xl font-bold text-rice-50 flex items-center gap-1.5">
              <img src="/icons/icon-192.png" alt="" className="h-6 w-6 rounded-md" />
              zKart.shop
            </span>
            <div className="flex items-center gap-3 text-rice-200">
              <AtSign className="h-4 w-4" />
              <MessageCircle className="h-4 w-4" />
              <Globe className="h-4 w-4" />
              <Share2 className="h-4 w-4" />
            </div>
            <p className="text-xs text-rice-200/70">© {new Date().getFullYear()} zKart.shop. All rights reserved.</p>
          </div>

          {cmsSections.map(({ section, items }) => (
            <div key={section} className="flex flex-col gap-2.5">
              <h3 className="font-display font-semibold text-rice-50 mb-1 capitalize">{section.replace('_', ' ')}</h3>
              {items.map((link) => (
                <CmsLinkItem key={link.id} link={link} />
              ))}
            </div>
          ))}

          <div className="flex flex-col gap-3">
            <h3 className="font-display font-semibold text-rice-50 mb-1">Download App</h3>
            <div className="flex items-center gap-2 rounded-lg border border-rice-50/20 px-3 py-2 w-fit text-xs text-rice-100">
              <QrCode className="h-8 w-8" /> Scan to install our PWA
            </div>
          </div>
        </div>

        {cmsSections.length === 0 && (
          <div className="border-t border-rice-50/10 py-4 text-center text-xs text-rice-200">
            © {new Date().getFullYear()} zKart.shop. All rights reserved.
          </div>
        )}
      </div>
    </footer>
  )
}
