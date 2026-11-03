import { actions } from './store'
/** Retour haptique léger (Android/Chrome ; ignoré silencieusement ailleurs). */
export function tap(pattern: number | number[] = 8) {
  if (!actions.exportAll().settings.haptics) return
  try { navigator.vibrate?.(pattern) } catch { /* noop */ }
}
