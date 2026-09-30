import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/**
 * Free OpenStreetMap picker (no API key, no billing). Used automatically when
 * Google Maps isn't configured or refuses the key.
 */
const pinIcon = L.divIcon({
  className: '',
  html: `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 2px rgba(0,0,0,.35))">
    <path d="M15 0C6.7 0 0 6.6 0 14.8 0 26 15 40 15 40s15-14 15-25.2C30 6.6 23.3 0 15 0z" fill="#7C3AED"/>
    <circle cx="15" cy="14.5" r="5.5" fill="#fff"/></svg>`,
  iconSize: [30, 40],
  iconAnchor: [15, 40],
})

export function OsmPickerMap({
  latitude,
  longitude,
  onChange,
}: {
  latitude: number
  longitude: number
  onChange: (lat: number, lng: number) => void
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!boxRef.current || mapRef.current) return
    const map = L.map(boxRef.current, { zoomControl: true, attributionControl: true }).setView([latitude, longitude], 16)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)
    const marker = L.marker([latitude, longitude], { draggable: true, icon: pinIcon }).addTo(map)
    marker.on('dragend', () => {
      const p = marker.getLatLng()
      onChangeRef.current(p.lat, p.lng)
    })
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng)
      onChangeRef.current(e.latlng.lat, e.latlng.lng)
    })
    mapRef.current = map
    markerRef.current = marker
    // the sheet animates open — recompute size once it's laid out
    setTimeout(() => map.invalidateSize(), 200)
    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // follow outside changes (search result / GPS)
  useEffect(() => {
    const m = markerRef.current
    if (!m || !mapRef.current) return
    const cur = m.getLatLng()
    if (Math.abs(cur.lat - latitude) > 1e-6 || Math.abs(cur.lng - longitude) > 1e-6) {
      m.setLatLng([latitude, longitude])
      mapRef.current.setView([latitude, longitude], mapRef.current.getZoom())
    }
  }, [latitude, longitude])

  return <div ref={boxRef} className="h-56 w-full rounded-lg border border-ink-100 bg-rice-100 z-0" />
}
