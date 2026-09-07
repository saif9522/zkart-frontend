import { useEffect, useRef, useState } from 'react'
import { API_BASE_URL } from '@/api/client'
import { useAuthStore } from '@/store/auth'
import type { OrderStatus } from '@/types'

interface TrackingState {
  status: OrderStatus | null
  location: { latitude: string; longitude: string } | null
  connected: boolean
}

export function useOrderTracking(orderId: string | undefined) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [state, setState] = useState<TrackingState>({ status: null, location: null, connected: false })
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!orderId || !accessToken) return

    const wsBase = API_BASE_URL.replace(/^http/, 'ws').replace(/\/api\/v1$/, '')
    const ws = new WebSocket(`${wsBase}/ws/orders/${orderId}/track/?token=${accessToken}`)
    wsRef.current = ws

    ws.onopen = () => setState((s) => ({ ...s, connected: true }))
    ws.onclose = () => setState((s) => ({ ...s, connected: false }))
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'snapshot' || data.type === 'status_update') {
        setState((s) => ({ ...s, status: data.status, location: data.location ?? s.location }))
      } else if (data.type === 'location_update') {
        setState((s) => ({ ...s, location: { latitude: data.latitude, longitude: data.longitude } }))
      }
    }

    return () => ws.close()
  }, [orderId, accessToken])

  return state
}
