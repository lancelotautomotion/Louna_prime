import { useSyncExternalStore } from 'react'
import { primeFor } from './bonus'

export type Sale = { id: string; amount: number; prime: number; ts: number }
export type Theme = 'auto' | 'light' | 'dark'
export type Settings = { dailyGoal: number; monthlyGoal: number; haptics: boolean; theme: Theme }
export type Profile = { firstName: string; lastName: string; store: string; employeeId: string; color: string }
type State = { version: 1; sales: Sale[]; settings: Settings; profile: Profile }

const KEY = 'primes.v1'
const DEFAULTS: Settings = { dailyGoal: 40, monthlyGoal: 600, haptics: true, theme: 'auto' }
export const PROFILE_COLORS = ['#0071e3', '#198038', '#8a35b8', '#b25000', '#d70015', '#0e7f93']
const EMPTY_PROFILE: Profile = { firstName: '', lastName: '', store: '', employeeId: '', color: PROFILE_COLORS[0] }

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as State
      return { version: 1, sales: Array.isArray(s.sales) ? s.sales : [], settings: { ...DEFAULTS, ...s.settings }, profile: { ...EMPTY_PROFILE, ...s.profile } }
    }
  } catch { /* stockage indisponible ou corrompu */ }
  return { version: 1, sales: [], settings: DEFAULTS, profile: EMPTY_PROFILE }
}

let state: State = load()
const listeners = new Set<() => void>()

function commit(next: State) {
  state = next
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* quota / mode privé */ }
  listeners.forEach((l) => l())
}

// Synchronisation entre onglets
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) { state = load(); listeners.forEach((l) => l()) }
  })
  // Demande au navigateur de ne pas purger nos données
  navigator.storage?.persist?.().catch(() => {})
}

const uid = () => (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`)

export const actions = {
  add(amount: number, ts = Date.now()): Sale {
    const sale = { id: uid(), amount, prime: primeFor(amount), ts }
    commit({ ...state, sales: [...state.sales, sale] })
    return sale
  },
  update(id: string, amount: number) {
    commit({ ...state, sales: state.sales.map((s) => (s.id === id ? { ...s, amount, prime: primeFor(amount) } : s)) })
  },
  remove(id: string) {
    commit({ ...state, sales: state.sales.filter((s) => s.id !== id) })
  },
  restore(sale: Sale) {
    commit({ ...state, sales: [...state.sales, sale].sort((a, b) => a.ts - b.ts) })
  },
  setSettings(patch: Partial<Settings>) {
    commit({ ...state, settings: { ...state.settings, ...patch } })
  },
  setProfile(patch: Partial<Profile>) {
    commit({ ...state, profile: { ...state.profile, ...patch } })
  },
  importAll(data: unknown): number {
    const d = data as Partial<State>
    if (!d || !Array.isArray(d.sales)) throw new Error('Fichier invalide')
    const clean = d.sales
      .filter((s): s is Sale => !!s && typeof s.amount === 'number' && typeof s.ts === 'number')
      .map((s) => ({ id: s.id || uid(), amount: Math.round(s.amount), ts: s.ts, prime: primeFor(s.amount) }))
    const known = new Set(state.sales.map((s) => s.id))
    const merged = [...state.sales, ...clean.filter((s) => !known.has(s.id))].sort((a, b) => a.ts - b.ts)
    commit({ ...state, sales: merged, settings: { ...state.settings, ...(d.settings ?? {}) }, profile: { ...state.profile, ...(d.profile ?? {}) } })
    return merged.length - state.sales.length
  },
  exportAll: () => state,
  wipe() { commit({ ...state, sales: [] }) },
}

const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l) }
export const useStore = () => useSyncExternalStore(subscribe, () => state)
