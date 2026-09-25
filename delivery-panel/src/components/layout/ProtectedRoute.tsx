import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'delivery') return <Navigate to="/login" replace />

  return <>{children}</>
}
