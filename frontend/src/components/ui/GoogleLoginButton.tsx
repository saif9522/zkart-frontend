import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
          }) => void
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void
        }
      }
    }
  }
}

interface GoogleLoginButtonProps {
  onCredential: (idToken: string) => void
}

/**
 * Renders Google's own Sign-In button via Google Identity Services (GIS).
 * Silently renders nothing if VITE_GOOGLE_CLIENT_ID isn't configured, so the
 * rest of the login page keeps working without it.
 */
export function GoogleLoginButton({ onCredential }: GoogleLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

  useEffect(() => {
    if (!clientId || !containerRef.current) return

    let cancelled = false

    const render = () => {
      if (cancelled || !window.google || !containerRef.current) return
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => onCredential(response.credential),
      })
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'continue_with',
      })
    }

    if (window.google) {
      render()
    } else {
      // The GIS <script> in index.html may not have finished loading yet.
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval)
          render()
        }
      }, 100)
      return () => {
        cancelled = true
        clearInterval(interval)
      }
    }
  }, [clientId, onCredential])

  if (!clientId) return null

  return <div ref={containerRef} className="w-full flex justify-center" />
}
