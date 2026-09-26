import { googleAuthFailed, loadGoogleMaps } from '@/lib/googleMaps'

declare const google: any // eslint-disable-line @typescript-eslint/no-explicit-any

export interface Place {
  lat: number
  lng: number
  label: string
  detail: string
}

// ---------------- Google (used when the key works) ----------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromGoogle(r: any): Place {
  const comp = (type: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.address_components?.find((c: any) => c.types.includes(type))?.long_name as string | undefined
  return {
    lat: r.geometry.location.lat(),
    lng: r.geometry.location.lng(),
    label:
      comp('sublocality_level_1') || comp('sublocality') || comp('neighborhood') || comp('route') || comp('locality') || 'Selected location',
    detail: r.formatted_address ?? '',
  }
}

const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))])

async function googleGeocode(request: Record<string, unknown>) {
  if (googleAuthFailed) throw new Error('google refused key')
  await withTimeout(loadGoogleMaps(), 6000)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { results } = await withTimeout<{ results: any[] }>(new google.maps.Geocoder().geocode(request), 6000)
  return results ?? []
}

// ---------------- OpenStreetMap / Nominatim (free fallback, no key) ----------------
interface NominatimResult {
  lat: string
  lon: string
  display_name: string
  address?: Record<string, string>
}

function fromNominatim(r: NominatimResult): Place {
  const a = r.address ?? {}
  const label =
    a.suburb || a.neighbourhood || a.quarter || a.village || a.town || a.city_district || a.city || a.county || a.state_district ||
    r.display_name.split(',')[0] || 'Selected location'
  return { lat: Number(r.lat), lng: Number(r.lon), label, detail: r.display_name }
}

const NOMINATIM = 'https://nominatim.openstreetmap.org'

async function nominatim(path: string, params: Record<string, string>) {
  const qs = new URLSearchParams({ format: 'jsonv2', addressdetails: '1', 'accept-language': 'en', ...params })
  const res = await withTimeout(fetch(`${NOMINATIM}/${path}?${qs}`, { headers: { Accept: 'application/json' } }), 8000)
  if (!res.ok) throw new Error(`nominatim ${res.status}`)
  return res.json()
}

// ---------------- public API ----------------

/** Coordinates → a human address. Google first, OpenStreetMap if Google isn't available. */
export async function reverseGeocode(lat: number, lng: number): Promise<Place> {
  try {
    const results = await googleGeocode({ location: { lat, lng } })
    if (results[0]) return { ...fromGoogle(results[0]), lat, lng }
  } catch {
    /* fall through to OpenStreetMap */
  }
  try {
    const r = (await nominatim('reverse', { lat: String(lat), lon: String(lng), zoom: '16' })) as NominatimResult
    if (r && r.display_name) return { ...fromNominatim(r), lat, lng }
  } catch {
    /* offline */
  }
  return { lat, lng, label: 'Current location', detail: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }
}

/** Free-text search (area, landmark or 6-digit pincode) — India only. */
export async function searchPlaces(query: string): Promise<Place[]> {
  const q = query.trim()
  try {
    const results = await googleGeocode({ address: q, componentRestrictions: { country: 'IN' } })
    if (results.length) return results.slice(0, 5).map(fromGoogle)
  } catch {
    /* fall through */
  }
  const isPincode = /^\d{6}$/.test(q)
  const list = (await nominatim(
    'search',
    isPincode ? { postalcode: q, countrycodes: 'in', limit: '5' } : { q, countrycodes: 'in', limit: '5' }
  )) as NominatimResult[]
  return list.map(fromNominatim)
}
