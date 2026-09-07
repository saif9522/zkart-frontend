import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from '@/lib/googleMaps'

declare const google: any

interface LiveLocationMapProps {
  location: { latitude: string; longitude: string } | null
  connected: boolean
}

export function LiveLocationMap({ location, connected }: LiveLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markerInstance = useRef<any>(null)
  const [mapsReady, setMapsReady] = useState(false)

  useEffect(() => {
    if (!location) return
    let cancelled = false
    loadGoogleMaps()
      .then(() => !cancelled && setMapsReady(true))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [!!location])

  useEffect(() => {
    if (!mapsReady || !mapRef.current || !location) return

    const position = { lat: Number(location.latitude), lng: Number(location.longitude) }

    if (!mapInstance.current) {
      mapInstance.current = new google.maps.Map(mapRef.current, {
        center: position,
        zoom: 15,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      })
      markerInstance.current = new google.maps.Marker({
        position,
        map: mapInstance.current,
        title: 'Delivery partner',
      })
    } else {
      markerInstance.current.setPosition(position)
      mapInstance.current.panTo(position)
    }
  }, [mapsReady, location])

  if (!location) {
    return (
      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4 mb-4 text-center">
        <p className="text-xs text-ink-300">
          {connected ? "Waiting for your delivery partner's location..." : 'Connecting to live tracking...'}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 overflow-hidden mb-4">
      <div className="px-3.5 py-2 border-b border-ink-100/60">
        <p className="text-sm font-semibold text-ink-500">Live location</p>
      </div>
      <div ref={mapRef} className="h-48 w-full bg-rice-100" />
    </div>
  )
}
