import { useEffect, useState } from 'react'

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
let deferred: BIPEvent | null = null
const ls = new Set<() => void>()
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as BIPEvent; ls.forEach((l) => l()) })
  window.addEventListener('appinstalled', () => { deferred = null; ls.forEach((l) => l()) })
}

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

export function useInstall() {
  const [, force] = useState(0)
  useEffect(() => { const l = () => force((n) => n + 1); ls.add(l); return () => { ls.delete(l) } }, [])
  return {
    canPrompt: !!deferred,
    prompt: async () => { if (!deferred) return; await deferred.prompt(); deferred = null; force((n) => n + 1) },
  }
}
