/**
 * Optional error monitoring. Set VITE_SENTRY_DSN (sentry.io → React project)
 * at build time to turn it on. Without it, Sentry is never even downloaded —
 * the dynamic import keeps it out of the main bundle.
 */
export function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  if (!dsn) return
  import('@sentry/react')
    .then((Sentry) => {
      Sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        tracesSampleRate: 0.05,
        sendDefaultPii: false, // never send customers' phone/address
        ignoreErrors: ['ResizeObserver loop', 'Network Error', 'Load failed', 'Failed to fetch'],
      })
    })
    .catch(() => undefined)
}
