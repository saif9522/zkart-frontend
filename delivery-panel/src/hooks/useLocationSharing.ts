import { useEffect, useRef, useState } from 'react'
import { deliveryApi } from '@/api/delivery'

const PUSH_INTERVAL_MS = 15000

export function useLocationSharing(active: boolean) {
  const [sharing, setSharing] = useState(false)
  const [lastPosition, setLastPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState('')
  const lastPushRef = useRef(0)
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!active) {
      setSharing(false)
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      return
    }

    if (!('geolocation' in navigator)) {
      setError('Location services are not available on this device.')
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setSharing(true)
        setError('')
        const { latitude, longitude } = position.coords
        setLastPosition({ lat: latitude, lng: longitude })

        const now = Date.now()
        if (now - lastPushRef.current >= PUSH_INTERVAL_MS) {
          lastPushRef.current = now
          deliveryApi.updateLocation(latitude, longitude).catch(() => {
            // A missed ping isn't critical — the next watchPosition tick will retry.
          })
        }
      },
      () => {
        setSharing(false)
        setError('Location permission denied — turn it on so customers can track their delivery.')
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    )
    watchIdRef.current = watchId

    return () => {
      navigator.geolocation.clearWatch(watchId)
      watchIdRef.current = null
    }
  }, [active])

  return { sharing, lastPosition, error }
}
