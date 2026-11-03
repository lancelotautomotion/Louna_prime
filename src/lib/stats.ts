import type { Sale } from './store'
import { dayKey } from './format'

export type Summary = { count: number; eligible: number; primes: number; revenue: number; avg: number }

export function summarize(sales: Sale[]): Summary {
  let eligible = 0, primes = 0, revenue = 0
  for (const s of sales) { revenue += s.amount; primes += s.prime; if (s.prime > 0) eligible++ }
  return { count: sales.length, eligible, primes, revenue, avg: sales.length ? Math.round(revenue / sales.length) : 0 }
}

export function groupByDay(sales: Sale[]): Map<string, Sale[]> {
  const m = new Map<string, Sale[]>()
  for (const s of sales) {
    const k = dayKey(s.ts)
    const arr = m.get(k)
    if (arr) arr.push(s); else m.set(k, [s])
  }
  return m
}

export function tierDistribution(sales: Sale[]) {
  const d: Record<number, number> = { 0: 0, 5: 0, 8: 0, 15: 0, 25: 0 }
  for (const s of sales) d[s.prime] = (d[s.prime] ?? 0) + 1
  return d
}
