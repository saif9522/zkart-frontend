import { useQuery } from '@tanstack/react-query'
import { Store } from 'lucide-react'
import { vendorsApi } from '@/api/vendors'
import { useLocationStore } from '@/store/location'

export function NearbyStores() {
  // Location comes from the header picker (Zepto-style) — no separate prompt card here.
  const location = useLocationStore((st) => st.location)
  const coords = location ? { lat: location.lat, lng: location.lng } : null

  const { data: stores } = useQuery({
    queryKey: ['nearby-stores', coords?.lat, coords?.lng],
    queryFn: () => vendorsApi.nearby(coords!.lat, coords!.lng),
    enabled: !!coords,
  })

  if (!stores || stores.length === 0) return null

  return (
    <section className="px-4 py-4">
      <h2 className="font-display text-lg font-semibold text-ink-500 mb-3">Stores near you</h2>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {stores.map((s) => (
          <div key={s.id} className="shrink-0 w-44 rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-3">
            <div className="h-9 w-9 rounded-full bg-forest-50 flex items-center justify-center mb-2">
              <Store className="h-4 w-4 text-forest-600" />
            </div>
            <p className="text-sm font-semibold text-ink-500 truncate">{s.shop_name}</p>
            <p className="text-xs text-ink-300 capitalize">{s.category.replace('_', ' ')}</p>
            <p className="text-xs text-forest-600 font-medium mt-1">{s.distance_km} km away</p>
          </div>
        ))}
      </div>
    </section>
  )
}
