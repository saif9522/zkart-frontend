import { useEffect, useRef, useState } from 'react'
import { googleAuthFailed, loadGoogleMaps } from '@/lib/googleMaps'
import { OsmPickerMap } from '@/components/ui/OsmPickerMap'

declare const google: any

interface LocationPickerMapProps {
  latitude: number
  longitude: number
  onChange: (lat: number, lng: number) => void
  /** (kept for compatibility — the map now falls back to OpenStreetMap instead of showing text) */
  unavailableText?: string
}

export function LocationPickerMap({ latitude, longitude, onChange }: LocationPickerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markerInstance = useRef<any>(null)
  // 'osm' = free OpenStreetMap fallback (no key / Google refused the key / couldn't load)
  const [status, setStatus] = useState<'loading' | 'ready' | 'osm'>(googleAuthFailed ? 'osm' : 'loading')

  useEffect(() => {
    let cancelled = false
    const onAuthFail = () => !cancelled && setStatus('osm')
    window.addEventListener('zkart:gmaps-auth-failed', onAuthFail)
    loadGoogleMaps()
      .then(() => {
        if (!cancelled) setStatus(googleAuthFailed ? 'osm' : 'ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('osm')
      })
    return () => {
      cancelled = true
      window.removeEventListener('zkart:gmaps-auth-failed', onAuthFail)
    }
  }, [])

  useEffect(() => {
    if (status !== 'ready' || !mapRef.current || mapInstance.current) return
    if (googleAuthFailed) return setStatus('osm')

    const center = { lat: latitude, lng: longitude }
    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: 15,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
    })
    const marker = new google.maps.Marker({ position: center, map, draggable: true })

    marker.addListener('dragend', () => {
      const pos = marker.getPosition()
      if (pos) onChange(pos.lat(), pos.lng())
    })
    map.addListener('click', (e: any) => {
      if (e.latLng) {
        marker.setPosition(e.latLng)
        onChange(e.latLng.lat(), e.latLng.lng())
      }
    })

    mapInstance.current = map
    markerInstance.current = marker
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  // Keep the pin synced if lat/lng change from outside (e.g. manual number input)
  useEffect(() => {
    if (markerInstance.current && mapInstance.current) {
      const pos = { lat: latitude, lng: longitude }
      markerInstance.current.setPosition(pos)
      mapInstance.current.panTo(pos)
    }
  }, [latitude, longitude])

  if (status === 'osm') {
    return (
      <div className="flex flex-col gap-1.5">
        <OsmPickerMap latitude={latitude} longitude={longitude} onChange={onChange} />
        <p className="text-[11px] text-ink-300">Tap the map or drag the pin to set your exact location.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div ref={mapRef} className="h-56 w-full rounded-lg border border-ink-100 bg-rice-100" />
      <p className="text-[11px] text-ink-300">Tap the map or drag the pin to set your exact location.</p>
    </div>
  )
}
