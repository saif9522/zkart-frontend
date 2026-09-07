import { api } from '@/api/client'
import type { AuthTokens, User } from '@/types'

export const authApi = {
  login: (phone: string, password: string) =>
    api.post<{ user: User; tokens: AuthTokens }>('/auth/login/', { phone, password }).then((r) => r.data),

  sendResetOtp: (phone: string) =>
    api.post('/auth/login/otp/send/', { phone, purpose: 'reset_password' }),

  resetPassword: (phone: string, code: string, new_password: string) =>
    api.post<{ message: string }>('/auth/password/reset/', { phone, code, new_password }).then((r) => r.data),

  getProfile: () => api.get<User>('/auth/profile/').then((r) => r.data),

  logout: (refresh: string) => api.post('/auth/logout/', { refresh }),
}
