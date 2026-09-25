import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, FileSpreadsheet } from 'lucide-react'
import {
  reportsApi,
  type AccountingGroupBy,
  type AccountingParams,
  type AccountingPeriod,
} from '@/api/reports'
import { apiErrorMessage } from '@/api/client'

const PERIODS: { value: AccountingPeriod; label: string }[] = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
]

const GROUPS: { value: AccountingGroupBy; label: string }[] = [
  { value: '', label: 'None (time only)' },
  { value: 'user', label: 'By User' },
  { value: 'shop', label: 'By Shop / Vendor' },
]

const STATUSES = ['', 'placed', 'accepted', 'packing', 'ready', 'pickup', 'out_for_delivery', 'delivered', 'cancelled']
const PAYMENT_METHODS = [
  { value: '', label: 'All methods' },
  { value: 'cod', label: 'Cash on delivery' },
  { value: 'razorpay', label: 'Razorpay (online)' },
  { value: 'wallet', label: 'Wallet' },
]

function inr(n: number | undefined): string {
  const v = Number(n || 0)
  return `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export function AccountingPage() {
  const [period, setPeriod] = useState<AccountingPeriod>('month')
  const [groupBy, setGroupBy] = useState<AccountingGroupBy>('')
  const [from, setFrom] = useState<string>(isoDaysAgo(365))
  const [to, setTo] = useState<string>(new Date().toISOString().slice(0, 10))
  const [status, setStatus] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('')

  const params: AccountingParams = useMemo(
    () => ({
      period,
      group_by: groupBy || undefined,
      from,
      to,
      status: status || undefined,
      payment_method: paymentMethod || undefined,
    }),
    [period, groupBy, from, to, status, paymentMethod],
  )

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['accounting', params],
    queryFn: () => reportsApi.accounting(params),
  })

  const handleDownload = async (format: 'csv' | 'xlsx') => {
    try {
      const blob = await reportsApi.accountingExport(params, format)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `accounting_${period}_${from}_${to}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(apiErrorMessage(err, 'Download failed.'))
    }
  }

  const entityHeader = groupBy === 'user' ? 'User' : groupBy === 'shop' || groupBy === 'vendor' ? 'Shop / Vendor' : null
  const summary = data?.summary

  const cards = [
    { label: 'Gross sales', value: inr(summary?.gross_sales), tone: 'text-forest-700' },
    { label: 'Paid (collected)', value: inr(summary?.paid_amount), tone: 'text-forest-700' },
    { label: 'Pending', value: inr(summary?.pending_amount), tone: 'text-mango-600' },
    { label: 'COD', value: inr(summary?.cod_amount), tone: 'text-ink-500' },
    { label: 'Online', value: inr(summary?.online_amount), tone: 'text-ink-500' },
    { label: 'Discounts given', value: inr(summary?.discounts), tone: 'text-chili-500' },
    { label: 'Orders', value: String(summary?.order_count ?? 0), tone: 'text-ink-500' },
    { label: 'Cancelled', value: String(summary?.cancelled_orders ?? 0), tone: 'text-chili-500' },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-500">Accounting &amp; Payments</h1>
          <p className="text-xs text-ink-300 mt-0.5">
            Revenue and payment breakdown by time period, user, and shop.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleDownload('csv')}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-rice-50 border border-ink-100 text-ink-400 hover:bg-rice-100"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
          <button
            onClick={() => handleDownload('xlsx')}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-forest-600 text-rice-50 hover:bg-forest-700"
          >
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <label className="flex flex-col gap-1 text-xs text-ink-300">
          Period
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as AccountingPeriod)}
            className="rounded-lg border border-ink-100 bg-white px-2.5 py-2 text-sm text-ink-500"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-ink-300">
          Group by
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as AccountingGroupBy)}
            className="rounded-lg border border-ink-100 bg-white px-2.5 py-2 text-sm text-ink-500"
          >
            {GROUPS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-ink-300">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-ink-100 bg-white px-2.5 py-2 text-sm text-ink-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-ink-300">
          To
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-ink-100 bg-white px-2.5 py-2 text-sm text-ink-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-ink-300">
          Order status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-ink-100 bg-white px-2.5 py-2 text-sm text-ink-500"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s === '' ? 'All statuses' : s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-ink-300">
          Payment method
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="rounded-lg border border-ink-100 bg-white px-2.5 py-2 text-sm text-ink-500"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-3.5">
            <p className="text-[11px] uppercase tracking-wide text-ink-300">{c.label}</p>
            <p className={`text-lg font-bold mt-1 ${c.tone}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs text-ink-300">
              <th className="px-4 py-3 font-medium">Period</th>
              {entityHeader && <th className="px-4 py-3 font-medium">{entityHeader}</th>}
              <th className="px-4 py-3 font-medium text-right">Orders</th>
              <th className="px-4 py-3 font-medium text-right">Gross sales</th>
              <th className="px-4 py-3 font-medium text-right">Paid</th>
              <th className="px-4 py-3 font-medium text-right">Pending</th>
              <th className="px-4 py-3 font-medium text-right">COD</th>
              <th className="px-4 py-3 font-medium text-right">Online</th>
              <th className="px-4 py-3 font-medium text-right">Discounts</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-ink-300">Loading...</td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-chili-500">
                  {apiErrorMessage(error, 'Could not load the report.')}
                </td>
              </tr>
            )}
            {!isLoading && !isError && data?.rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-ink-300">
                  No orders in this range.
                </td>
              </tr>
            )}
            {data?.rows.map((r, i) => (
              <tr key={`${r.bucket}-${r.shop || r.customer || i}`} className="border-b border-ink-100/60 last:border-0">
                <td className="px-4 py-3 font-medium text-ink-500">{r.bucket}</td>
                {entityHeader && <td className="px-4 py-3 text-ink-400">{r.shop || r.customer || '—'}</td>}
                <td className="px-4 py-3 text-right text-ink-400">
                  {r.order_count}
                  {r.cancelled_orders > 0 && (
                    <span className="text-chili-500"> ({r.cancelled_orders} cancelled)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-ink-500">{inr(r.gross_sales)}</td>
                <td className="px-4 py-3 text-right text-forest-700">{inr(r.paid_amount)}</td>
                <td className="px-4 py-3 text-right text-mango-600">{inr(r.pending_amount)}</td>
                <td className="px-4 py-3 text-right text-ink-400">{inr(r.cod_amount)}</td>
                <td className="px-4 py-3 text-right text-ink-400">{inr(r.online_amount)}</td>
                <td className="px-4 py-3 text-right text-ink-400">{inr(r.discounts)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
