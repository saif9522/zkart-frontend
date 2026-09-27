import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/**
 * Free OpenStreetMap (no API key, no billing) showing the shop (pickup), the
 * customer (drop) and the rider's own position. The big "Navigate" button
 * still opens turn-by-turn directions in the phone's maps app.
 */
const pin = (color: string, letter: string) =>
  L.divIcon({
    className: '',
    html: `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 2px rgba(0,0,0,.35))">
      <path d="M15 0C6.7 0 0 6.6 0 14.8 0 26 15 40 15 40s15-14 15-25.2C30 6.6 23.3 0 15 0z" fill="${color}"/>
      <text x="15" y="19" text-anchor="middle" font-size="12" font-weight="700" font-family="sans-serif" fill="#fff">${letter}</text></svg>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
  })
const riderIcon = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#2563EB;border:3px solid #fff;box-shadow:0 0 0 2px rgba(37,99,235,.35)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const num = (v?: string | number | null) => (v === null || v === undefined || v === '' ? null : Number(v))

export function RouteMap({
  shop,
  customer,
  rider,
  goingToShop,
}: {
  shop: { lat?: string | null; lng?: string | null }
  customer: { lat?: string | null; lng?: string | null }
  rider?: { lat: number; lng: number } | null
  goingToShop: boolean
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!boxRef.current || mapRef.current) return
    const map = L.map(boxRef.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return
    layer.clearLayers()
    const pts: L.LatLngExpression[] = []
    const s = [num(shop.lat), num(shop.lng)]
    const c = [num(customer.lat), num(customer.lng)]
    if (s[0] !== null && s[1] !== null) {
      L.marker([s[0], s[1]], { icon: pin('#7C3AED', 'S'), title: 'Shop (pickup)' }).addTo(layer)
      pts.push([s[0], s[1]])
    }
    if (c[0] !== null && c[1] !== null) {
      L.marker([c[0], c[1]], { icon: pin('#E0284F', 'C'), title: 'Customer (drop)' }).addTo(layer)
      pts.push([c[0], c[1]])
    }
    if (rider) {
      L.marker([rider.lat, rider.lng], { icon: riderIcon, title: 'You' }).addTo(layer)
      pts.push([rider.lat, rider.lng])
    }
    // dashed line: where the rider is heading next
    const shopPt = s[0] !== null && s[1] !== null ? [s[0], s[1]] : null
    const custPt = c[0] !== null && c[1] !== null ? [c[0], c[1]] : null
    // with the rider's position: rider → next stop; without it: shop → customer
    const from = rider ? [rider.lat, rider.lng] : shopPt
    const to = rider ? (goingToShop ? shopPt : custPt) : custPt
    if (from && to) L.polyline([from as L.LatLngTuple, to as L.LatLngTuple], { color: '#7C3AED', weight: 3, dashArray: '6 8' }).addTo(layer)
    if (pts.length === 1) map.setView(pts[0], 15)
    else if (pts.length > 1) map.fitBounds(L.latLngBounds(pts), { padding: [28, 28], maxZoom: 16 })
    setTimeout(() => map.invalidateSize(), 150)
  }, [shop.lat, shop.lng, customer.lat, customer.lng, rider?.lat, rider?.lng, goingToShop]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-1">
      <div ref={boxRef} className="h-44 w-full rounded-lg border border-ink-100 bg-rice-100 z-0" />
      <p className="text-[11px] text-ink-300 flex gap-3">
        <span><b className="text-forest-600">S</b> Shop</span>
        <span><b className="text-chili-600">C</b> Customer</span>
        {rider && <span><b className="text-[#2563EB]">●</b> You</span>}
      </p>
    </div>
  )
}
