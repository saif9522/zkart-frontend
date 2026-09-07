import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/auth'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken
  if (!refreshToken) return null

  try {
    const { data } = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, { refresh: refreshToken })
    useAuthStore.getState().setAccessToken(data.access)
    return data.access as string
  } catch {
    useAuthStore.getState().logout()
    return null
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true
      // De-dupe concurrent 401s into a single refresh call.
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

/** Extracts a human-readable message from a DRF error response. */
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    // No response at all = network/CORS/server-down issue, not a validation error.
    if (!error.response) {
      return 'Could not reach the server. Is the backend running?'
    }

    const status = error.response.status
    const contentType = String(error.response.headers?.['content-type'] || '')
    const data = error.response.data

    // A 5xx in Django DEBUG mode returns a full HTML traceback page, not JSON.
    // Never render that directly — it's a wall of text, not a user-facing message.
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
