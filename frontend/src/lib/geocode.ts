import { loadGoogleMaps } from '@/lib/googleMaps'

declare const google: any // eslint-disable-line @typescript-eslint/no-explicit-any

export interface Place {
  lat: number
  lng: number
  label: string
  detail: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPlace(r: any): Place {
  const comp = (type: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.address_components?.find((c: any) => c.types.includes(type))?.long_name as string | undefined
  const label =
    comp('sublocality_level_1') || comp('sublocality') || comp('neighborhood') || comp('route') || comp('locality') || 'Selected location'
  return {
    lat: r.geometry.location.lat(),
    lng: r.geometry.location.lng(),
    label,
    detail: r.formatted_address ?? '',
  }
}

/** Coordinates → a human address. Falls back gracefully if Maps isn't configured. */
export async function reverseGeocode(lat: number, lng: number): Promise<Place> {
  try {
    await loadGoogleMaps()
    const { results } = await new google.maps.Geocoder().geocode({ location: { lat, lng } })
    if (results?.[0]) return { ...toPlace(results[0]), lat, lng }
  } catch {
    /* no key / quota / offline — use coordinates */
  }
  return { lat, lng, label: 'Current location', detail: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }
}

/** Free-text address search (India only). */
export async function searchPlaces(query: string): Promise<Place[]> {
  await loadGoogleMaps()
  const { results } = await new google.maps.Geocoder().geocode({ address: query, componentRestrictions: { country: 'IN' } })
  return (results ?? []).slice(0, 5).map(toPlace)
}
