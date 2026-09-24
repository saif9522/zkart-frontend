/* zKart zKart Rider — service worker.
 * Only job: show push notifications (new order / new delivery) even when the
 * app tab is closed, and open the right screen when the alert is tapped.
 * Deliberately no offline caching — this panel must always show live data. */
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  if (!event.data) return
  let payload
  try {
    payload = event.data.json()
  } catch (e) {
    payload = { title: 'zKart Rider', body: event.data.text() }
  }
  const data = payload.data || {}
  const url = payload.url || (data.order_id ? '/orders' : '/')
  event.waitUntil(
    self.registration.showNotification(payload.title || 'zKart Rider', {
      body: payload.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.order_id || undefined, // same order → replace, don't stack
      renotify: true,
      requireInteraction: true, // stays on screen until the vendor/rider acts
      vibrate: [300, 150, 300, 150, 300],
      data: { url },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
