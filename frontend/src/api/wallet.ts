import { api } from '@/api/client'
import type { Paginated } from '@/types'

export interface WalletTransaction {
  id: string
  type: 'credit' | 'debit'
  reason: string
  amount: string
  signed_amount: string
  order_reference: string
  description: string
  created_at: string
}

export interface ReferralInfo {
  referral_code: string
  total_referred: number
  total_earned: string
}

export interface MyReferral {
  id: string
  referred_user_name: string
  referred_user_phone: string
  reward_credited: boolean
  reward_credited_at: string | null
  created_at: string
}

export const walletApi = {
  balance: () => api.get<{ balance: string }>('/wallet/balance/').then((r) => r.data.balance),
  transactions: () => api.get<Paginated<WalletTransaction>>('/wallet/transactions/').then((r) => r.data),
  referralInfo: () => api.get<ReferralInfo>('/wallet/referral-info/').then((r) => r.data),
  myReferrals: () => api.get<Paginated<MyReferral>>('/wallet/my-referrals/').then((r) => r.data),
}
