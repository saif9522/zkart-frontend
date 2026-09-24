import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Store } from 'lucide-react'
import { vendorsApi } from '@/api/vendors'

export function NearbyStores() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'denied'>('idle')

  const { data: stores } = useQuery({
    queryKey: ['nearby-stores', coords?.lat, coords?.lng],
    queryFn: () => vendorsApi.nearby(coords!.lat, coords!.lng),
    enabled: !!coords,
  })

  const requestLocation = () => {
    if (!('geolocation' in navigator)) {
      setStatus('denied')
      return
    }
    setStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setStatus('idle')
      },
      () => setStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  if (!coords) {
    return (
      <section className="px-4 py-4">
        <button
          onClick={requestLocation}
          disabled={status === 'loading'}
          className="w-full flex items-center gap-3 rounded-[var(--radius-card)] bg-rice-50 border border-dashed border-ink-100 p-4 text-left"
        >
          <div className="h-10 w-10 rounded-full bg-forest-50 flex items-center justify-center shrink-0">
            <MapPin className="h-5 w-5 text-forest-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-500">
              {status === 'loading' ? 'Locating you...' : 'Aapke paas ke stores dekhein'}
            </p>
            <p className="text-xs text-ink-300">
              {status === 'denied' ? 'Location permission nahi mili — settings me check karein.' : 'Location on karein'}
            </p>
          </div>
        </button>
      </section>
    )
  }

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
