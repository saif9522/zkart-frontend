declare const google: any

let loadPromise: Promise<void> | null = null

export function loadGoogleMaps(): Promise<void> {
  if (typeof google !== 'undefined' && google?.maps) return Promise.resolve()
  if (loadPromise) return loadPromise

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
  if (!apiKey) {
    return Promise.reject(new Error('Google Maps API key not configured (VITE_GOOGLE_MAPS_API_KEY).'))
  }

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('google-maps-script')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps.')))
      return
    }
    const script = document.createElement('script')
    script.id = 'google-maps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Maps.'))
    document.head.appendChild(script)
  })

  return loadPromise
}
