import { useCallback, useEffect, useState } from 'react'
import { api } from '@/api/client'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export type PushStatus = 'unsupported' | 'not-configured' | 'default' | 'denied' | 'subscribed'

/**
 * Real phone notifications for new orders — work even when the tab/app is
 * closed (Android Chrome; on iPhone only after "Add to Home Screen").
 * Uses the backend's existing VAPID push (apps/notifications).
 */
export function usePushNotifications() {
  const supported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  const [status, setStatus] = useState<PushStatus>(supported ? 'default' : 'unsupported')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!supported) return
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (sub) {
          setStatus('subscribed')
          // Re-send on every load: keeps the server copy fresh and re-links the
          // device if a different user logged in on it.
          const json = sub.toJSON()
          api
            .post('/notifications/push/subscribe/', { endpoint: json.endpoint, p256dh_key: json.keys?.p256dh, auth_key: json.keys?.auth })
            .catch(() => undefined)
        } else if (Notification.permission === 'denied') {
          setStatus('denied')
        }
      })
      .catch(() => undefined)
  }, [supported])

  const subscribe = useCallback(async () => {
    if (!supported) return
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        return
      }
      const { data } = await api.get<{ public_key: string }>('/notifications/push/vapid-key/')
      if (!data.public_key) {
        setStatus('not-configured')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.public_key),
      })
      const json = sub.toJSON()
      await api.post('/notifications/push/subscribe/', {
        endpoint: json.endpoint,
        p256dh_key: json.keys?.p256dh,
        auth_key: json.keys?.auth,
      })
      setStatus('subscribed')
    } catch (err) {
      console.error('Push subscription failed', err)
    } finally {
      setLoading(false)
    }
  }, [supported])

  return { status, loading, subscribe }
}
