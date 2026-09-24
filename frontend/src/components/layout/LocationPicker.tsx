import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { Crosshair, Home, Loader2, MapPin, Search, X } from 'lucide-react'
import { addressApi } from '@/api/addresses'
import { Button } from '@/components/ui/Button'
import { LocationPickerMap } from '@/components/ui/LocationPickerMap'
import { reverseGeocode, searchPlaces, type Place } from '@/lib/geocode'
import { useAuthStore } from '@/store/auth'
import { useLocationStore } from '@/store/location'

/**
 * Zepto-style "Your location" sheet, opened from the header:
 * current location (GPS) · address search · saved addresses → fine-tune the
 * pin on the map → Confirm.
 */
export function LocationPicker() {
  const { pickerOpen, closePicker, setLocation, location } = useLocationStore()
  const isAuthed = !!useAuthStore((s) => s.accessToken)
  const [pin, setPin] = useState<Place | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Place[]>([])
  const [busy, setBusy] = useState<'gps' | 'search' | 'resolve' | null>(null)
  const [error, setError] = useState('')

  const { data: saved } = useQuery({
    queryKey: ['addresses'],
    queryFn: addressApi.list,
    enabled: pickerOpen && isAuthed,
  })

  useEffect(() => {
    if (pickerOpen) {
      setPin(location ? { ...location } : null)
      setQuery('')
      setResults([])
      setError('')
    }
  }, [pickerOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.body.style.overflow = pickerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [pickerOpen])

  if (!pickerOpen) return null

  const useGps = () => {
    setError('')
    if (!('geolocation' in navigator)) {
      setError('This device can’t share location. Search your area instead.')
      return
    }
    setBusy('gps')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setPin(await reverseGeocode(pos.coords.latitude, pos.coords.longitude))
        setBusy(null)
      },
      () => {
        setBusy(null)
        setError('Location permission is off. Allow it in browser settings, or search your area below.')
      },
      { enableHighAccuracy: true, timeout: 12000 }
    )
  }

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim().length < 3) return
    setError('')
    setBusy('search')
    try {
      const found = await searchPlaces(query.trim())
      setResults(found)
      if (found.length === 0) setError('No matching place found. Try a nearby landmark or pincode.')
    } catch {
      setError('Search is unavailable right now — use your current location instead.')
    } finally {
      setBusy(null)
    }
  }

  const movePin = async (lat: number, lng: number) => {
    setBusy('resolve')
    setPin(await reverseGeocode(lat, lng))
    setBusy(null)
  }

  // Portal to <body>: the sticky header uses backdrop-blur, which would trap a
  // `fixed` overlay inside the header box instead of covering the screen.
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-label="Choose delivery location">
      <button className="absolute inset-0 bg-ink-500/50" onClick={closePicker} aria-label="Close" />
      <div className="relative w-full sm:max-w-lg bg-rice-50 rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] overflow-y-auto overscroll-contain">
        <div className="sticky top-0 z-10 bg-rice-50 flex items-center justify-between px-4 py-3.5 border-b border-ink-100">
          <h2 className="font-display font-semibold text-ink-500">Your location</h2>
          <button onClick={closePicker} className="p-1 text-ink-300 hover:text-ink-500" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <form onSubmit={runSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a new address, area or pincode"
              className="w-full rounded-xl border border-ink-100 bg-rice-100 pl-9 pr-20 py-2.5 text-sm outline-none focus:bg-rice-50 focus:border-forest-400"
            />
            <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-forest-600 text-rice-50 text-xs font-semibold px-3 py-1.5">
              {busy === 'search' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </button>
          </form>

          <button onClick={useGps} disabled={busy === 'gps'} className="flex items-center gap-3 rounded-xl border border-ink-100 px-3 py-3 text-left hover:border-forest-400">
            <span className="h-9 w-9 rounded-full bg-forest-50 flex items-center justify-center shrink-0">
              {busy === 'gps' ? <Loader2 className="h-4 w-4 animate-spin text-forest-600" /> : <Crosshair className="h-4 w-4 text-forest-600" />}
            </span>
            <span>
              <span className="block text-sm font-semibold text-forest-700">Use my current location</span>
              <span className="block text-xs text-ink-300">Using GPS</span>
            </span>
          </button>

          {error && <p className="text-xs text-chili-600">{error}</p>}

          {results.length > 0 && (
            <ul className="rounded-xl border border-ink-100 divide-y divide-ink-100/60">
              {results.map((r, i) => (
                <li key={i}>
                  <button onClick={() => { setPin(r); setResults([]) }} className="w-full flex gap-3 items-start text-left px-3 py-2.5 hover:bg-forest-50/60">
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

          {pin && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-ink-400">Drag the pin or tap the map to your exact spot</p>
              <div className="rounded-xl overflow-hidden">
                <LocationPickerMap
                  latitude={pin.lat}
                  longitude={pin.lng}
                  onChange={movePin}
                  unavailableText="Map can't load right now — your location below will still be used."
                />
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-forest-50 px-3 py-2.5">
                <MapPin className="h-4 w-4 text-forest-600 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-500">{busy === 'resolve' ? 'Finding address…' : pin.label}</p>
                  <p className="text-xs text-ink-400 line-clamp-2">{pin.detail}</p>
                </div>
              </div>
              <Button size="lg" className="w-full" disabled={busy === 'resolve'} onClick={() => setLocation(pin)}>
                Confirm location
              </Button>
            </div>
          )}

          {isAuthed && saved && saved.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-ink-400 mb-1.5">Your saved addresses</p>
              <ul className="rounded-xl border border-ink-100 divide-y divide-ink-100/60">
                {saved.map((a) => (
                  <li key={a.id}>
                    <button
                      onClick={() =>
                        setLocation({
                          lat: Number(a.latitude),
                          lng: Number(a.longitude),
                          label: a.label === 'home' ? 'Home' : a.label === 'work' ? 'Work' : a.city || 'Saved address',
                          detail: [a.address_line, a.landmark, a.city, a.pincode].filter(Boolean).join(', '),
                        })
                      }
                      className="w-full flex gap-3 items-start text-left px-3 py-2.5 hover:bg-forest-50/60"
                    >
                      <Home className="h-4 w-4 text-ink-300 mt-0.5 shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-ink-500 capitalize">{a.label}</span>
                        <span className="block text-xs text-ink-300 line-clamp-2">
                          {[a.address_line, a.city, a.pincode].filter(Boolean).join(', ')}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

/** Header button: "Select Location" until chosen, then the chosen area's name. */
export function LocationButton({ compact = false }: { compact?: boolean }) {
  const { location, openPicker } = useLocationStore()
  return (
    <button
      onClick={openPicker}
      className="flex items-center gap-0.5 text-xs text-ink-400 hover:text-forest-700 max-w-[14rem] min-w-0"
      aria-label="Choose delivery location"
    >
      {compact && <MapPin className="h-3 w-3 shrink-0" />}
      <span className={`truncate ${location ? 'font-semibold text-ink-500' : ''}`}>{location ? location.label : 'Select Location'}</span>
      <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  )
}
