import { useEffect, useState } from 'react'
import { notificationsApi } from '@/api/notifications'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export type PushStatus = 'unsupported' | 'default' | 'granted' | 'denied' | 'subscribed'

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>('default')
  const [loading, setLoading] = useState(false)

  const supported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window

  useEffect(() => {
    if (!supported) {
      setStatus('unsupported')
      return
    }
    checkExistingSubscription()
  }, [])

  const checkExistingSubscription = async () => {
    const registration = await navigator.serviceWorker.ready
    const existing = await registration.pushManager.getSubscription()
    if (existing) {
      setStatus('subscribed')
    } else {
      setStatus(Notification.permission === 'denied' ? 'denied' : 'default')
    }
  }

  const subscribe = async () => {
    if (!supported) return
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        return
      }

      const publicKey = await notificationsApi.vapidPublicKey()
      if (!publicKey) {
        console.warn('Push notifications not configured on the server yet.')
        setStatus('granted')
        return
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      const json = subscription.toJSON()
      await notificationsApi.subscribe({
        endpoint: json.endpoint!,
        p256dh_key: json.keys!.p256dh,
        auth_key: json.keys!.auth,
      })
      setStatus('subscribed')
    } catch (err) {
      console.error('Push subscription failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const unsubscribe = async () => {
    setLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await notificationsApi.unsubscribe(subscription.endpoint)
        await subscription.unsubscribe()
      }
      setStatus('default')
    } finally {
      setLoading(false)
    }
  }

  return { status, loading, supported, subscribe, unsubscribe }
}
