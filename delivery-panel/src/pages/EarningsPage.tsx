import { useQuery } from '@tanstack/react-query'
import { deliveryApi } from '@/api/delivery'
import { Badge } from '@/components/ui/Badge'

export function EarningsPage() {
  const { data: transactions, isLoading } = useQuery({ queryKey: ['transactions'], queryFn: deliveryApi.transactions })
  const { data: attendance } = useQuery({ queryKey: ['attendance'], queryFn: deliveryApi.attendanceHistory })

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-ink-500">Earnings</h1>

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 divide-y divide-ink-100/60">
        {isLoading && <p className="text-ink-300 animate-pulse p-4">Loading...</p>}
        {(transactions?.results ?? []).map((t) => (
          <div key={t.id} className="flex items-center gap-3 p-3.5">
            <div className="flex-1">
              <p className="text-sm font-medium text-ink-500 capitalize">{t.type.replace('_', ' ')}</p>
              <p className="text-xs text-ink-300">
                {t.order_reference || t.description || '—'} · {new Date(t.created_at).toLocaleDateString()}
              </p>
            </div>
            <span className={`font-mono text-sm ${Number(t.amount) >= 0 ? 'text-forest-600' : 'text-chili-600'}`}>
              {Number(t.amount) >= 0 ? '+' : ''}₹{t.amount}
            </span>
          </div>
        ))}
        {transactions && transactions.results.length === 0 && (
          <p className="text-ink-300 text-center py-8">No transactions yet.</p>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-ink-500 mb-2">Attendance history</h2>
        <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 divide-y divide-ink-100/60">
          {(attendance?.results ?? []).map((a) => (
            <div key={a.id} className="flex items-center justify-between p-3.5 text-sm">
              <span className="text-ink-500">{a.date}</span>
              <span className="text-ink-300">
                {a.check_in_time ? new Date(a.check_in_time).toLocaleTimeString() : '—'} →{' '}
                {a.check_out_time ? new Date(a.check_out_time).toLocaleTimeString() : '—'}
              </span>
              {a.hours_worked != null && <Badge status="active" label={`${a.hours_worked.toFixed(1)}h`} />}
            </div>
          ))}
          {attendance && attendance.results.length === 0 && (
            <p className="text-ink-300 text-center py-8">No attendance recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
