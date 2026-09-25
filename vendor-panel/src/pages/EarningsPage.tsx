import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowDownLeft, ArrowUpRight, IndianRupee, Landmark, Percent } from 'lucide-react'
import { vendorApi } from '@/api/vendor'
import { StatCard } from '@/components/ui/StatCard'
import { formatDate, formatINR } from '@/lib/utils'
import type { VendorTransaction } from '@/types'

const TYPE_LABEL: Record<VendorTransaction['type'], string> = {
  credit: 'Order settlement',
  commission: 'Platform commission',
  payout: 'Payout to bank',
  adjustment: 'Adjustment',
}

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'credit', label: 'Settlements' },
  { value: 'commission', label: 'Commission' },
  { value: 'payout', label: 'Payouts' },
] as const

export function EarningsPage() {
  const [filter, setFilter] = useState<string>('')
  const { data: dashboard } = useQuery({ queryKey: ['vendor-dashboard'], queryFn: vendorApi.dashboard })
  const { data, isLoading } = useQuery({ queryKey: ['vendor-transactions'], queryFn: vendorApi.transactions })
  const all = useMemo(() => data?.results ?? [], [data])

  const totals = useMemo(() => {
    const sum = (t: VendorTransaction['type']) =>
      all.filter((x) => x.type === t).reduce((acc, x) => acc + Number(x.amount), 0)
    return { credit: sum('credit'), commission: sum('commission'), payout: sum('payout') }
  }, [all])

  const rows = filter ? all.filter((t) => t.type === filter) : all

  const exportCsv = () => {
    const header = 'Date,Type,Order,Description,Amount\n'
    const body = all
      .map((t) =>
        [new Date(t.created_at).toISOString(), TYPE_LABEL[t.type], t.order_reference, `"${t.description.replace(/"/g, '""')}"`, t.amount].join(',')
      )
      .join('\n')
    const url = URL.createObjectURL(new Blob([header + body], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `zkart-earnings-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-500">Earnings</h1>
        {all.length > 0 && (
          <button onClick={exportCsv} className="text-xs font-semibold text-forest-600 border border-forest-100 rounded-lg px-2.5 py-1.5">
            Download CSV
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Payable balance" value={formatINR(dashboard?.earnings.balance ?? 0)} icon={IndianRupee} />
        <StatCard label="Total settled" value={formatINR(totals.credit)} icon={ArrowDownLeft} />
        <StatCard label="Commission paid" value={formatINR(Math.abs(totals.commission))} icon={Percent} accent="mango" />
        <StatCard label="Paid out to bank" value={formatINR(Math.abs(totals.payout))} icon={Landmark} accent="chili" />
      </div>

      <p className="text-xs text-ink-300 -mt-2">
        An order's money is settled here after it's delivered (order value minus platform commission). Balance is
        transferred to your bank/UPI on payout.
      </p>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              filter === f.value ? 'bg-forest-600 text-rice-50' : 'bg-rice-50 border border-ink-100 text-ink-400'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 divide-y divide-ink-100/60">
        {isLoading && <p className="text-ink-300 animate-pulse p-4">Loading...</p>}
        {rows.map((t) => {
          const positive = Number(t.amount) >= 0
          return (
            <div key={t.id} className="flex items-center gap-3 p-3.5">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${positive ? 'bg-forest-50 text-forest-600' : 'bg-chili-100 text-chili-600'}`}>
                {positive ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-500">{TYPE_LABEL[t.type] ?? t.type}</p>
                <p className="text-xs text-ink-300 truncate">
                  {t.order_reference || t.description || '—'} · {formatDate(t.created_at)}
                </p>
              </div>
              <span className={`font-mono text-sm font-semibold ${positive ? 'text-forest-600' : 'text-chili-600'}`}>
                {positive ? '+' : '−'}
                {formatINR(Math.abs(Number(t.amount)))}
              </span>
            </div>
          )
        })}
        {data && rows.length === 0 && <p className="text-ink-300 text-center py-8 text-sm">No transactions yet.</p>}
      </div>
    </div>
  )
}
