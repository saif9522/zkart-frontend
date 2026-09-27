import { useEffect, useRef, useState } from 'react'
import { Crosshair, Loader2, MapPin, Search } from 'lucide-react'
import { LocationPickerMap } from '@/components/ui/LocationPickerMap'
import { searchPlaces, type Place } from '@/lib/geocode'
import { inIndia } from '@/lib/inIndia'


/**
 * Easy shop location: search an area/landmark/pincode, use GPS, or let it find
 * the spot from the address typed above — then fine-tune by dragging the pin.
 * Nobody has to understand latitude/longitude.
 */
export function ShopLocationFinder({
  address,
  latitude,
  longitude,
  onChange,
}: {
  address: { line: string; city: string; state?: string; pincode: string }
  latitude: string
  longitude: string
  onChange: (lat: number, lng: number) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Place[]>([])
  const [busy, setBusy] = useState<'search' | 'gps' | 'auto' | null>(null)
  const [note, setNote] = useState('')
  const manuallyPlaced = useRef(false)
  const lastAutoKey = useRef('')

  const lat = Number(latitude)
  const lng = Number(longitude)
  const valid = Number.isFinite(lat) && Number.isFinite(lng) && inIndia(lat, lng)

  const place = (p: { lat: number; lng: number }, manual: boolean) => {
    manuallyPlaced.current = manual
    onChange(p.lat, p.lng)
  }

  /** address → pin: full address, then pincode, then city */
  const findFromAddress = async (auto: boolean) => {
    const tries = [
      [address.line, address.city, address.pincode, 'India'].filter(Boolean).join(', '),
      address.pincode && /^\d{6}$/.test(address.pincode) ? address.pincode : '',
      [address.city, address.state, 'India'].filter(Boolean).join(', '),
    ].filter((q) => q && q.replace(/[, ]|India/g, '').length >= 3)
    if (!tries.length) {
      if (!auto) setNote('Pehle upar City aur Pincode bharein.')
      return
    }
    setBusy('auto')
    setNote('')
    try {
      for (const q of tries) {
        // eslint-disable-next-line no-await-in-loop -- try the most exact search first
        const found = await searchPlaces(q).catch(() => [])
        if (found.length) {
          place(found[0], false)
          setNote(`📍 Address se mila: ${found[0].detail}. Zarurat ho to pin khiska ke theek karein.`)
          return
        }
      }
      if (!auto) setNote('Address se jagah nahi mili — upar search karein ya "Use my current location" dabayein.')
    } finally {
      setBusy(null)
    }
  }

  // Auto-locate once City + 6-digit pincode are filled (unless the owner already placed the pin).
  useEffect(() => {
    const key = `${address.line}|${address.city}|${address.pincode}`
    if (!/^\d{6}$/.test(address.pincode || '') || !address.city || manuallyPlaced.current) return
    if (key === lastAutoKey.current) return
    const t = setTimeout(() => {
      lastAutoKey.current = key
      void findFromAddress(true)
    }, 900)
    return () => clearTimeout(t)
  }, [address.line, address.city, address.pincode]) // eslint-disable-line react-hooks/exhaustive-deps

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim().length < 3) return
    setBusy('search')
    setNote('')
    try {
      const found = await searchPlaces(query.trim())
      setResults(found)
      if (!found.length) setNote('Kuch nahi mila — pas ka landmark ya pincode likh ke try karein.')
    } catch {
      setNote('Search abhi nahi chal raha — "Use my current location" try karein.')
    } finally {
      setBusy(null)
    }
  }

  const useGps = () => {
    if (!('geolocation' in navigator)) return setNote('Is device mein GPS nahi hai.')
    setBusy('gps')
    setNote('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        place({ lat: pos.coords.latitude, lng: pos.coords.longitude }, true)
        setBusy(null)
        setNote('📍 Aapki abhi ki location lagayi. Dukaan pe khade hokar dabayein to sabse sahi aata hai.')
      },
      () => {
        setBusy(null)
        setNote('Location permission band hai — browser settings mein allow karein, ya search karein.')
      },
      { enableHighAccuracy: true, timeout: 12000 }
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-ink-400">Shop location on map</span>
      <form onSubmit={runSearch} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search area, landmark ya pincode (jaise Batla House, 110025)"
          className="w-full rounded-lg border border-ink-100 bg-rice-100 pl-9 pr-20 py-2.5 text-sm outline-none focus:bg-rice-50 focus:border-forest-400"
        />
        <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-forest-600 text-rice-50 text-xs font-semibold px-3 py-1.5">
          {busy === 'search' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </button>
      </form>
      {results.length > 0 && (
        <ul className="rounded-lg border border-ink-100 divide-y divide-ink-100/60 bg-rice-50">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => {
                  place(r, true)
                  setResults([])
                  setNote(`📍 ${r.detail}`)
                }}
                className="w-full text-left flex gap-2 px-3 py-2 hover:bg-forest-50/60"
              >
                <MapPin className="h-4 w-4 text-ink-300 mt-0.5 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink-500">{r.label}</span>
                  <span className="block text-xs text-ink-300 line-clamp-2">{r.detail}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={useGps} className="inline-flex items-center gap-1.5 rounded-lg border border-forest-600 text-forest-700 text-xs font-semibold px-3 py-1.5">
          {busy === 'gps' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />} Use my current location
        </button>
        <button type="button" onClick={() => void findFromAddress(false)} className="inline-flex items-center gap-1.5 rounded-lg border border-ink-100 text-ink-500 text-xs font-semibold px-3 py-1.5">
          {busy === 'auto' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />} Upar ke address se dhoondo
        </button>
      </div>
      {note && <p className="text-xs text-ink-400">{note}</p>}
      {!valid && (
        <p className="text-xs font-semibold text-chili-600">
          ⚠ Abhi ki location India ke bahar hai — search karein, GPS use karein, ya map pe dukaan ki jagah tap karein.
        </p>
      )}
      <LocationPickerMap
        latitude={valid ? lat : 23.5}
        longitude={valid ? lng : 80.5}
        onChange={(la, ln) => place({ lat: la, lng: ln }, true)}
      />
    </div>
  )
}
