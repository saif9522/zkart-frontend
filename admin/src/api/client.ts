import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/auth'
import { endpointOf, usePaginationStore } from '@/store/pagination'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export const api = axios.create({ baseURL: API_BASE_URL })

// ---- Automatic list pagination (see store/pagination.ts + components/ui/Pager.tsx) ----
api.interceptors.request.use((config) => {
  if ((config.method ?? 'get').toLowerCase() === 'get') {
    const ep = endpointOf(config.url)
    const params = (config.params ?? {}) as Record<string, unknown>
    const page = usePaginationStore.getState().page[ep]
    // Don't touch requests that choose their own page/page size (dropdowns, Products page).
    if (page && page > 1 && params.page === undefined && params.page_size === undefined) {
      config.params = { ...params, page }
      ;(config as typeof config & { _autoPage?: boolean })._autoPage = true
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    const d = response.data as { count?: unknown; results?: unknown; next?: unknown } | undefined
    if (d && typeof d.count === 'number' && Array.isArray(d.results)) {
      const ep = endpointOf(response.config.url)
      const full = d.next ? d.results.length : undefined // a full page tells us the page size
      usePaginationStore.getState().record(ep, d.count, full)
    }
    return response
  },
  async (error) => {
    // Page no longer exists (search/filter shrank the list) → go back to page 1 once.
    const cfg = error?.config as (Record<string, unknown> & { _autoPage?: boolean; params?: Record<string, unknown> }) | undefined
    if (error?.response?.status === 404 && cfg?._autoPage) {
      const ep = endpointOf(cfg.url as string)
      usePaginationStore.getState().setPage(ep, 1)
      const { page: _dropped, ...rest } = cfg.params ?? {}
      return api({ ...cfg, params: rest, _autoPage: false } as never)
    }
    return Promise.reject(error)
  }
)

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  // Another tab may have refreshed (and rotated) the tokens — read the latest saved copy first.
  await useAuthStore.persist?.rehydrate?.()
  const refreshToken = useAuthStore.getState().refreshToken
  if (!refreshToken) return null

  try {
    const { data } = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, { refresh: refreshToken })
    // The backend ROTATES refresh tokens (old one is blacklisted), so the new
    // one MUST be saved — dropping it was what logged people out every ~30 min.
    useAuthStore.getState().setAccessToken(data.access, data.refresh)
    return data.access as string
  } catch (err) {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined
    if (status === 400 || status === 401) {
      // Token really is invalid/expired — unless another tab rotated it a moment ago.
      await useAuthStore.persist?.rehydrate?.()
      const latest = useAuthStore.getState()
      if (latest.refreshToken && latest.refreshToken !== refreshToken && latest.accessToken) {
        return latest.accessToken
      }
      useAuthStore.getState().logout()
    }
    // Network error / server waking up (Render free plan) / 5xx → keep the session.
    return null
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true
      refreshPromise = refreshPromise || refreshAccessToken()
      const newToken = await refreshPromise
      refreshPromise = null
      if (newToken) {
        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      }
    }
    return Promise.reject(error)
  }
)

export function apiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Could not reach the server. Is the backend running?'
    }

    const status = error.response.status
    const contentType = String(error.response.headers?.['content-type'] || '')
    const data = error.response.data

    if (status >= 500 || !contentType.includes('application/json')) {
      return `Server error (${status}). Check the backend terminal/logs for details.`
    }

    if (typeof data === 'string') return data.slice(0, 300)
    if (data?.detail) return String(data.detail).slice(0, 300)
    if (Array.isArray(data)) return data.join(' ').slice(0, 300)
    if (data && typeof data === 'object') {
      const firstKey = Object.keys(data)[0]
      const val = (data as Record<string, unknown>)[firstKey]
      if (Array.isArray(val)) return `${firstKey}: ${val[0]}`.slice(0, 300)
      if (typeof val === 'string') return val.slice(0, 300)
    }
  }
  return fallback
}
