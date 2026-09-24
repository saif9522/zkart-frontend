import { api } from '@/api/client'
import type {
  Attendance,
  AvailableOrder,
  DeliveryDashboard,
  DeliveryProfile,
  DeliveryTransaction,
  MyDeliveryOrder,
  Paginated,
} from '@/types'

export const deliveryApi = {
  onboard: (payload: FormData) =>
    api.post<DeliveryProfile>('/delivery/onboard/', payload, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  profile: () => api.get<DeliveryProfile>('/delivery/profile/').then((r) => r.data),
  updateProfile: (payload: Partial<DeliveryProfile>) =>
    api.patch<DeliveryProfile>('/delivery/profile/', payload).then((r) => r.data),
  dashboard: () => api.get<DeliveryDashboard>('/delivery/dashboard/').then((r) => r.data),

  goOnline: (isOnline: boolean) =>
    api.post<DeliveryProfile>('/delivery/go-online/', { is_online: isOnline }).then((r) => r.data),
  updateLocation: (latitude: number, longitude: number) =>
    api.post('/delivery/location/', { latitude, longitude }),

  availableOrders: () => api.get<AvailableOrder[]>('/delivery/orders/available/').then((r) => r.data),
  myOrders: (status?: string) =>
    api.get<MyDeliveryOrder[]>('/delivery/orders/mine/', { params: status ? { status } : {} }).then((r) => r.data),
  claimOrder: (orderId: string) =>
    api.post<MyDeliveryOrder>(`/delivery/orders/${orderId}/assign/`).then((r) => r.data),
  confirmPickup: (orderId: string, otp: string) =>
    api.post<MyDeliveryOrder>(`/delivery/orders/${orderId}/confirm-pickup/`, { otp }).then((r) => r.data),
  startDelivery: (orderId: string) =>
    api.post<MyDeliveryOrder>(`/delivery/orders/${orderId}/start-delivery/`).then((r) => r.data),
  markNearby: (orderId: string) =>
    api.post<MyDeliveryOrder>(`/delivery/orders/${orderId}/mark-nearby/`).then((r) => r.data),
  confirmDelivery: (orderId: string, otp: string) =>
    api.post<MyDeliveryOrder>(`/delivery/orders/${orderId}/confirm-delivery/`, { otp }).then((r) => r.data),

  checkIn: () => api.post<Attendance>('/delivery/attendance/check-in/').then((r) => r.data),
  checkOut: () => api.post<Attendance>('/delivery/attendance/check-out/').then((r) => r.data),
  attendanceHistory: () => api.get<Paginated<Attendance>>('/delivery/attendance/').then((r) => r.data),

  transactions: () => api.get<Paginated<DeliveryTransaction>>('/delivery/transactions/').then((r) => r.data),
}
