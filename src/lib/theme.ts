import { useEffect } from 'react'
import type { Theme } from './store'

/** Applique le thème choisi sur <html> et met à jour la couleur de la barre système. */
export function useApplyTheme(theme: Theme) {
  useEffect(() => {
    const root = document.documentElement
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      if (theme === 'auto') delete root.dataset.theme
      else root.dataset.theme = theme
      const dark = theme === 'dark' || (theme === 'auto' && mq.matches)
      document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', dark ? '#000000' : '#f2f2f7'))
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
}
