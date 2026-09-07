import { api } from '@/api/client'
import type {
  AuditLogEntry,
  BackupLog,
  City,
  MonitoringStats,
  Paginated,
  PlatformSettings,
  StaffPermission,
} from '@/types'

export const superAdminApi = {
  // Platform settings
  getSettings: () => api.get<PlatformSettings>('/super-admin/settings/').then((r) => r.data),
  updateSettings: (payload: Partial<PlatformSettings>) =>
    api.patch<PlatformSettings>('/super-admin/settings/', payload).then((r) => r.data),

  // Cities
  cities: () => api.get<Paginated<City>>('/super-admin/cities/').then((r) => r.data),
  createCity: (payload: Partial<City>) => api.post<City>('/super-admin/cities/', payload).then((r) => r.data),
  updateCity: (id: string, payload: Partial<City>) =>
    api.patch<City>(`/super-admin/cities/${id}/`, payload).then((r) => r.data),
  deleteCity: (id: string) => api.delete(`/super-admin/cities/${id}/`),

  // Staff / RBAC
  createAdmin: (payload: {
    phone: string
    full_name: string
    password: string
    department?: string
    can_manage_vendors: boolean
    can_manage_delivery_partners: boolean
    can_manage_orders: boolean
    can_manage_coupons: boolean
    can_manage_categories: boolean
    can_manage_users: boolean
    can_view_reports: boolean
  }) => api.post<StaffPermission>('/super-admin/staff/create-admin/', payload).then((r) => r.data),

  staffPermissions: () => api.get<Paginated<StaffPermission>>('/super-admin/staff-permissions/').then((r) => r.data),
  updateStaffPermission: (id: string, payload: Partial<StaffPermission>) =>
    api.patch<StaffPermission>(`/super-admin/staff-permissions/${id}/`, payload).then((r) => r.data),

  // Audit logs
  logs: (params: { user?: string; method?: string; path_contains?: string } = {}) =>
    api.get<Paginated<AuditLogEntry>>('/super-admin/logs/', { params }).then((r) => r.data),

  // Backups
  triggerBackup: () => api.post<{ detail: string; backup_id: string }>('/super-admin/backups/trigger/').then((r) => r.data),
  backups: () => api.get<BackupLog[]>('/super-admin/backups/').then((r) => r.data),

  // Monitoring
  monitoring: () => api.get<MonitoringStats>('/super-admin/monitoring/').then((r) => r.data),
}
