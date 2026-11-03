const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
const eur0 = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

export const fmtCents = (c: number) => eur.format(c / 100)
export const fmtEuros = (e: number) => (Number.isInteger(e) ? eur0.format(e) : eur.format(e))
export const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

/** Clé de jour locale "YYYY-MM-DD". */
export function dayKey(d: Date | number = new Date()): string {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}
/** Clé de mois locale "YYYY-MM". */
export const monthKey = (d: Date | number = new Date()) => dayKey(d).slice(0, 7)

export function fmtDayLong(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  const s = new Date(y, m - 1, d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}
export function fmtMonth(key: string): string {
  const [y, m] = key.split('-').map(Number)
  const s = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** "155,5" → 15550 centimes. Retourne NaN si invalide. */
export function parseAmount(input: string): number {
  if (!input) return NaN
  const n = Number(input.replace(',', '.'))
  return Number.isFinite(n) ? Math.round(n * 100) : NaN
}
/** 15550 → "155,5" (édition). */
export const centsToInput = (c: number) => String(c / 100).replace('.', ',')
