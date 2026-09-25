import { api } from '@/api/client'

export const notificationsApi = {
  vapidPublicKey: () => api.get<{ public_key: string }>('/notifications/push/vapid-key/').then((r) => r.data.public_key),
  subscribe: (payload: { endpoint: string; p256dh_key: string; auth_key: string }) =>
    api.post('/notifications/push/subscribe/', payload),
  unsubscribe: (endpoint: string) => api.post('/notifications/push/unsubscribe/', { endpoint }),
}
