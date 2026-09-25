import { api } from '@/api/client'

export type AccountingPeriod = 'day' | 'week' | 'month' | 'year'
export type AccountingGroupBy = '' | 'user' | 'vendor' | 'shop'

export interface AccountingRow {
  period: AccountingPeriod
  bucket: string
  customer?: string
  shop?: string
  order_count: number
  cancelled_orders: number
  items_subtotal: number
  delivery_charges: number
  discounts: number
  gross_sales: number
  paid_amount: number
  pending_amount: number
  cod_amount: number
  online_amount: number
}

export interface AccountingSummary {
  order_count: number
  cancelled_orders: number
  items_subtotal: number
  delivery_charges: number
  discounts: number
  gross_sales: number
  paid_amount: number
  pending_amount: number
  cod_amount: number
  online_amount: number
}

export interface AccountingResponse {
  period: AccountingPeriod
  group_by: AccountingGroupBy | null
  from: string
  to: string
  summary: AccountingSummary
  rows: AccountingRow[]
}

export interface AccountingParams {
  period: AccountingPeriod
  group_by?: AccountingGroupBy
  from?: string
  to?: string
  status?: string
  payment_method?: string
}

function buildParams(params: AccountingParams): Record<string, string> {
  const out: Record<string, string> = { period: params.period }
  if (params.group_by) out.group_by = params.group_by
  if (params.from) out.from = params.from
  if (params.to) out.to = params.to
  if (params.status) out.status = params.status
  if (params.payment_method) out.payment_method = params.payment_method
  return out
}

export const reportsApi = {
  accounting: (params: AccountingParams) =>
    api
      .get<AccountingResponse>('/reports/accounting/', { params: buildParams(params) })
      .then((r) => r.data),

  accountingExport: (params: AccountingParams, format: 'csv' | 'xlsx') =>
    api
      .get('/reports/accounting/', {
        params: { ...buildParams(params), export: format },
        responseType: 'blob',
      })
      .then((r) => r.data as Blob),
}
