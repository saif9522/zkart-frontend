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
  nearby: (lat: number, lng: number, category?: string) =>
    api
      .get<NearbyVendor[]>('/vendors/nearby/', { params: { lat, lng, ...(category ? { category } : {}) } })
      .then((r) => r.data),
}
