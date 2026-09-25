import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { vendorApi } from '@/api/vendor'

const SOUND_KEY = 'zkart-vendor-sound'

/**
 * Polls for NEW (placed) orders every 10s from anywhere in the panel.
 * When a new one arrives: plays a loud ding (Web Audio — no mp3 needed),
 * vibrates the phone, and shows "(2) New order" in the browser tab.
 *
 * Browsers block audio until the user has tapped something once, so the
 * vendor enables sound with one tap and we remember it.
 */
export function useNewOrderAlert() {
  const [soundOn, setSoundOn] = useState(() => {
    try {
      return localStorage.getItem(SOUND_KEY) === '1'
    } catch {
      return false
    }
  })
  const seenIds = useRef<Set<string> | null>(null)
  const audioCtx = useRef<AudioContext | null>(null)

  const { data } = useQuery({
    queryKey: ['vendor-orders', 'placed', 'alert'],
    queryFn: () => vendorApi.orders('placed'),
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  })
  const newOrders = data?.results ?? []

  const ding = () => {
    const ctx = audioCtx.current
    if (!ctx) return
    // Three rising beeps — hard to miss in a noisy shop.
    ;[0, 0.25, 0.5].forEach((offset, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.value = 660 + i * 220
      gain.gain.setValueAtTime(0.25, ctx.currentTime + offset)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.22)
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + offset)
      osc.stop(ctx.currentTime + offset + 0.22)
    })
  }

  useEffect(() => {
    if (!data) return
    const ids = new Set(newOrders.map((o) => o.id))
    if (seenIds.current === null) {
      seenIds.current = ids // first load: don't ring for orders already waiting
    } else {
      const fresh = [...ids].some((id) => !seenIds.current!.has(id))
      seenIds.current = ids
      if (fresh) {
        if (soundOn) ding()
        if ('vibrate' in navigator) navigator.vibrate?.([300, 150, 300])
      }
    }
    const base = document.title.replace(/^\(\d+\)\s*/, '')
    document.title = ids.size > 0 ? `(${ids.size}) ${base}` : base
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const enableSound = () => {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioCtx.current = audioCtx.current ?? new Ctx()
      void audioCtx.current.resume()
      localStorage.setItem(SOUND_KEY, '1')
    } catch {
      /* storage/audio unavailable — the visual badge still works */
    }
    setSoundOn(true)
    ding()
  }

  // Sound was enabled on a previous visit: the AudioContext needs any first tap to unlock.
  useEffect(() => {
    if (!soundOn || audioCtx.current) return
    const unlock = () => {
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        audioCtx.current = new Ctx()
        void audioCtx.current.resume()
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [soundOn])

  return { newCount: newOrders.length, soundOn, enableSound, soundUnlocked: !!audioCtx.current }
}
