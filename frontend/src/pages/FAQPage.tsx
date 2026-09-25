import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { cmsApi } from '@/api/cms'

export function FAQPage() {
  const { data: faqs, isLoading } = useQuery({ queryKey: ['faqs'], queryFn: cmsApi.faqs })
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="font-display text-xl font-semibold text-ink-500 mb-4">Frequently asked questions</h1>

      {isLoading && <p className="text-ink-300 animate-pulse">Loading...</p>}

      <div className="flex flex-col gap-2">
        {(faqs ?? []).map((faq) => {
          const open = openId === faq.id
          return (
            <div key={faq.id} className="rounded-xl bg-rice-50 border border-ink-100/60 overflow-hidden">
              <button
                onClick={() => setOpenId(open ? null : faq.id)}
                className="w-full flex items-center justify-between gap-3 p-3.5 text-left"
              >
                <span className="text-sm font-medium text-ink-500">{faq.question}</span>
                <ChevronDown className={`h-4 w-4 text-ink-300 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>
              {open && <p className="px-3.5 pb-3.5 text-sm text-ink-400">{faq.answer}</p>}
            </div>
          )
        })}
        {faqs && faqs.length === 0 && (
          <div className="text-center py-12">
            <HelpCircle className="h-10 w-10 text-ink-200 mx-auto" />
            <p className="text-ink-300 mt-2 text-sm">No FAQs yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
