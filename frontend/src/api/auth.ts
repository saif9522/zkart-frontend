import { api } from '@/api/client'
import type { AuthTokens, User } from '@/types'

export const authApi = {
  register: (
    phone: string,
    password: string,
    full_name: string,
    role: 'customer' | 'vendor' = 'customer',
    referral_code?: string
  ) =>
    api
      .post<{ user: User; tokens: AuthTokens }>('/auth/register/', { phone, password, full_name, role, referral_code })
      .then((r) => r.data),

  loginWithPassword: (phone: string, password: string) =>
    api.post<{ user: User; tokens: AuthTokens }>('/auth/login/', { phone, password }).then((r) => r.data),

  sendOtp: (phone: string, purpose: 'login' | 'signup' | 'reset_password' = 'login') =>
    api.post('/auth/login/otp/send/', { phone, purpose }),

  verifyOtp: (phone: string, code: string, full_name?: string, purpose: 'login' | 'signup' = 'login') =>
    api
      .post<{ user: User; tokens: AuthTokens }>('/auth/login/otp/verify/', {
        phone,
        code,
        purpose,
        full_name,
      })
      .then((r) => r.data),

  resetPassword: (phone: string, code: string, new_password: string) =>
    api.post<{ message: string }>('/auth/password/reset/', { phone, code, new_password }).then((r) => r.data),

  getProfile: () => api.get<User>('/auth/profile/').then((r) => r.data),

  updateProfile: (payload: Partial<Pick<User, 'full_name' | 'email'>>) =>
    api.put<User>('/auth/profile/', payload).then((r) => r.data),

  logout: (refresh: string) => api.post('/auth/logout/', { refresh }),

  googleLogin: (id_token: string) =>
    api.post<{ user: User; tokens: AuthTokens }>('/auth/login/google/', { id_token }).then((r) => r.data),
}
