import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  setSession: (user: User, tokens: { access: string; refresh: string }) => void
  setAccessToken: (access: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: (user, tokens) => set({ user, accessToken: tokens.access, refreshToken: tokens.refresh }),
      setAccessToken: (access) => set({ accessToken: access }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'mog-delivery-auth' }
  )
)
