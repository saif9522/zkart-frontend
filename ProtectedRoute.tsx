import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'

export function ProtectedRoute({ children, superAdminOnly }: { children: ReactNode; superAdminOnly?: boolean }) {
  const user = useAuthStore((s) => s.user)

  if (!user) return <Navigate to="/login" replace />
  if (!['admin', 'super_admin'].includes(user.role)) return <Navigate to="/login" replace />
  if (superAdminOnly && user.role !== 'super_admin') return <Navigate to="/" replace />

  return <>{children}</>
}
