import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'mog-install-prompt-dismissed'

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

export function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIOSHint, setShowIOSHint] = useState(false)
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISSED_KEY) === '1')

  useEffect(() => {
    if (isStandalone()) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    if (isIOS()) {
      setShowIOSHint(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    setDismissed(true)
    sessionStorage.setItem(DISMISSED_KEY, '1')
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  if (dismissed || isStandalone() || (!deferredPrompt && !showIOSHint)) return null

  return (
    <div className="fixed bottom-20 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-40 rounded-2xl bg-forest-900 text-rice-50 p-4 shadow-lg">
      <button onClick={dismiss} className="absolute top-2.5 right-2.5 text-rice-100/50 hover:text-rice-50">
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-3 pr-5">
        <img src="/icons/icon-192.png" alt="" className="h-10 w-10 rounded-xl shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold">Install zKart.shop</p>
          <p className="text-xs text-rice-100/70">Faster access, right from your home screen</p>
        </div>
      </div>

      {deferredPrompt ? (
        <button
          onClick={handleInstall}
          className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-xl bg-mango-500 text-forest-900 text-sm font-semibold py-2.5"
        >
          <Download className="h-4 w-4" /> Install app
        </button>
      ) : (
        <p className="mt-3 text-xs text-rice-100/80 flex items-center gap-1.5">
          Tap <Share className="h-3.5 w-3.5 inline" /> then "Add to Home Screen"
        </p>
      )}
    </div>
  )
}
