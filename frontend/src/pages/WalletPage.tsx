import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Copy, Gift, IndianRupee, Share2, Wallet as WalletIcon } from 'lucide-react'
import { walletApi } from '@/api/wallet'
import { formatINR } from '@/lib/utils'

const REASON_LABELS: Record<string, string> = {
  referral_bonus: 'Referral bonus',
  refund: 'Order refund',
  cashback: 'Cashback',
  order_payment: 'Order payment',
  admin_adjustment: 'Adjustment',
}

export function WalletPage() {
  const [copied, setCopied] = useState(false)

  const { data: balance } = useQuery({ queryKey: ['wallet-balance'], queryFn: walletApi.balance })
  const { data: transactions } = useQuery({ queryKey: ['wallet-transactions'], queryFn: walletApi.transactions })
  const { data: referral } = useQuery({ queryKey: ['referral-info'], queryFn: walletApi.referralInfo })

  const shareLink = referral ? `${window.location.origin}/register?ref=${referral.referral_code}` : ''

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'zKart.shop',
          text: `zKart.shop join karo mere referral code ${referral?.referral_code} se aur bonus payein!`,
          url: shareLink,
        })
      } catch {
        // user cancelled the share sheet — nothing to do
      }
    } else {
      handleCopy()
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      <h1 className="font-display text-xl font-semibold text-ink-500 mb-4">Wallet</h1>

      <div className="rounded-[var(--radius-card)] bg-forest-700 text-rice-50 p-5 mb-4">
        <div className="flex items-center gap-2 text-rice-100/70 text-sm">
          <WalletIcon className="h-4 w-4" /> Wallet balance
        </div>
        <p className="font-display text-3xl font-bold mt-1">{balance !== undefined ? formatINR(balance) : '—'}</p>
      </div>

      {referral && (
        <div className="rounded-[var(--radius-card)] bg-mango-50 border border-mango-100 p-4 mb-4">
          <div className="flex items-center gap-2 text-ink-500 font-semibold text-sm">
            <Gift className="h-4 w-4 text-mango-600" /> Refer & earn
          </div>
          <p className="text-xs text-ink-400 mt-1">
            Dost ko invite karo — dono ko bonus milega jab unka pehla order deliver ho jaye.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="flex-1 rounded-lg bg-rice-50 border border-ink-100 px-3 py-2 font-mono text-sm text-ink-500 tracking-widest text-center">
              {referral.referral_code}
            </div>
            <button onClick={handleCopy} className="h-9 w-9 rounded-lg bg-rice-50 border border-ink-100 flex items-center justify-center text-ink-400 hover:text-forest-600">
              {copied ? <Check className="h-4 w-4 text-forest-600" /> : <Copy className="h-4 w-4" />}
            </button>
            <button onClick={handleShare} className="h-9 w-9 rounded-lg bg-forest-600 flex items-center justify-center text-rice-50">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-ink-300 mt-2">
            {referral.total_referred} log join kiye · {formatINR(referral.total_earned)} kamaya
          </p>
        </div>
      )}

      <h2 className="text-sm font-semibold text-ink-500 mb-2">Transaction history</h2>
      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 divide-y divide-ink-100/60">
        {(transactions?.results ?? []).map((t) => (
          <div key={t.id} className="flex items-center gap-3 p-3.5">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${t.type === 'credit' ? 'bg-forest-50 text-forest-600' : 'bg-chili-50 text-chili-600'}`}>
              <IndianRupee className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink-500">{REASON_LABELS[t.reason] ?? t.reason}</p>
              <p className="text-xs text-ink-300 truncate">{t.description || t.order_reference || '—'}</p>
            </div>
            <span className={`font-mono text-sm font-semibold ${t.type === 'credit' ? 'text-forest-600' : 'text-chili-600'}`}>
              {t.type === 'credit' ? '+' : '-'}{formatINR(t.amount)}
            </span>
          </div>
        ))}
        {transactions && transactions.results.length === 0 && (
          <p className="text-sm text-ink-300 text-center py-8">Koi transaction nahi hai abhi tak.</p>
        )}
      </div>
    </div>
  )
}
