import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from '@/lib/googleMaps'

declare const google: any

interface LocationPickerMapProps {
  latitude: number
  longitude: number
  onChange: (lat: number, lng: number) => void
}

export function LocationPickerMap({ latitude, longitude, onChange }: LocationPickerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markerInstance = useRef<any>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading')

  useEffect(() => {
    let cancelled = false
    loadGoogleMaps()
      .then(() => {
        if (!cancelled) setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('unavailable')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (status !== 'ready' || !mapRef.current || mapInstance.current) return

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

  if (status === 'unavailable') {
    return (
      <p className="text-xs text-ink-300 rounded-lg border border-dashed border-ink-100 px-3 py-4 text-center">
        Map unavailable (no Google Maps API key configured) — enter latitude/longitude manually below.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div ref={mapRef} className="h-56 w-full rounded-lg border border-ink-100 bg-rice-100" />
      <p className="text-[11px] text-ink-300">Tap the map or drag the pin to set your exact location.</p>
    </div>
  )
}
