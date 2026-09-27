import { api } from '@/api/client'

export interface NearbyVendor {
  id: string
  shop_name: string
  category: string
  address_line: string
  city: string
  latitude: string
  longitude: string
  is_open: boolean
  distance_km: number
}

export const vendorsApi = {
  /** Does any branch deliver here? (pincode match OR within 10 km) */
  serviceability: (q: { lat?: number | string; lng?: number | string; pincode?: string }) =>
    api
      .get<{ available: boolean; branches: { branch_code: string; shop_name: string; is_open: boolean }[]; message: string }>(
        '/vendors/serviceability/',
        { params: Object.fromEntries(Object.entries(q).filter(([, v]) => v !== undefined && v !== '')) }
      )
      .then((r) => r.data),
  nearby: (lat: number, lng: number, category?: string) =>
    api
      .get<NearbyVendor[]>('/vendors/nearby/', { params: { lat, lng, ...(category ? { category } : {}) } })
      .then((r) => r.data),
}
