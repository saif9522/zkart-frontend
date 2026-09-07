import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bike, Clock, IndianRupee, LogIn, LogOut, Package, PackageCheck } from 'lucide-react'
import { deliveryApi } from '@/api/delivery'
import { apiErrorMessage } from '@/api/client'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useState } from 'react'

export function DashboardPage() {
  const queryClient = useQueryClient()
  const [attendanceError, setAttendanceError] = useState('')

  const { data, isLoading } = useQuery({ queryKey: ['delivery-dashboard'], queryFn: deliveryApi.dashboard })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['delivery-dashboard'] })

  const toggleOnline = useMutation({
    mutationFn: (next: boolean) => deliveryApi.goOnline(next),
    onSuccess: invalidate,
  })

  const checkIn = useMutation({
    mutationFn: deliveryApi.checkIn,
    onError: (err) => setAttendanceError(apiErrorMessage(err, 'Could not check in.')),
  })
  const checkOut = useMutation({
    mutationFn: deliveryApi.checkOut,
    onError: (err) => setAttendanceError(apiErrorMessage(err, 'Could not check out.')),
  })

  if (isLoading) return <p className="text-ink-300 animate-pulse">Loading...</p>
  if (!data) return null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-500 flex items-center gap-2">
            <Bike className="h-5 w-5 text-forest-600" /> Your dashboard
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge status={data.status === 'approved' ? 'approved' : data.status} />
            <Badge status={data.is_online ? 'active' : 'inactive'} label={data.is_online ? 'Online' : 'Offline'} />
          </div>
        </div>
        <Button
          size="sm"
          variant={data.is_online ? 'danger' : 'primary'}
          onClick={() => toggleOnline.mutate(!data.is_online)}
          loading={toggleOnline.isPending}
          disabled={data.status !== 'approved'}
        >
          {data.is_online ? 'Go offline' : 'Go online'}
        </Button>
      </div>

      {data.status === 'pending' && (
        <div className="rounded-xl bg-mango-50 border border-mango-100 p-4 text-sm text-ink-500 flex items-center gap-2">
          <Clock className="h-4 w-4 text-mango-600 shrink-0" />
          Your account is awaiting approval. You'll be able to go online and accept orders once approved.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Active orders" value={data.active_orders} icon={Package} />
        <StatCard label="Delivered today" value={data.delivered_today} icon={PackageCheck} />
        <StatCard label="Earned today" value={`₹${data.earnings.today}`} icon={IndianRupee} />
        <StatCard label="Wallet balance" value={`₹${data.earnings.balance}`} icon={IndianRupee} />
      </div>

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4">
        <h2 className="text-sm font-semibold text-ink-500 mb-3">Attendance</h2>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => checkIn.mutate()} loading={checkIn.isPending}>
            <LogIn className="h-4 w-4" /> Check in
          </Button>
          <Button size="sm" variant="ghost" onClick={() => checkOut.mutate()} loading={checkOut.isPending}>
            <LogOut className="h-4 w-4" /> Check out
          </Button>
        </div>
        {attendanceError && <p className="text-xs text-chili-600 mt-2">{attendanceError}</p>}
      </div>
    </div>
  )
}
