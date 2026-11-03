import { useSyncExternalStore } from 'react'
import { primeFor } from './bonus'

export type Sale = { id: string; amount: number; prime: number; ts: number }
export type Theme = 'auto' | 'light' | 'dark'
export type Settings = { dailyGoal: number; monthlyGoal: number; haptics: boolean; theme: Theme }
export type Profile = { firstName: string; lastName: string; store: string; employeeId: string; color: string }
/** Données partagées entre appareils (le thème et les vibrations restent propres à chaque appareil). */
export type SharedData = { dailyGoal: number; monthlyGoal: number; profile: Profile }

type State = {
  version: 1
  sales: Sale[]
  settings: Settings
  profile: Profile
  /** Modifications locales pas encore envoyées au serveur : id → horodatage de la modif. */
  pending: Record<string, number>
  /** Ventes supprimées localement, à propager (suppression « douce »). */
  deleted: Record<string, number>
  /** Profil / objectifs modifiés localement et pas encore envoyés (horodatage, 0 = rien). */
  sharedDirty: number
}

const KEY = 'primes.v1'
const DEFAULTS: Settings = { dailyGoal: 40, monthlyGoal: 600, haptics: true, theme: 'auto' }
export const PROFILE_COLORS = ['#0071e3', '#198038', '#8a35b8', '#b25000', '#d70015', '#0e7f93']
const EMPTY_PROFILE: Profile = { firstName: '', lastName: '', store: '', employeeId: '', color: PROFILE_COLORS[0] }

function load(): State {
  const empty: State = { version: 1, sales: [], settings: DEFAULTS, profile: EMPTY_PROFILE, pending: {}, deleted: {}, sharedDirty: 0 }
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as Partial<State>
      return {
        ...empty,
        sales: Array.isArray(s.sales) ? s.sales : [],
        settings: { ...DEFAULTS, ...s.settings },
        profile: { ...EMPTY_PROFILE, ...s.profile },
        pending: s.pending ?? {},
        deleted: s.deleted ?? {},
        sharedDirty: s.sharedDirty ?? 0,
      }
    }
  } catch { /* stockage indisponible ou corrompu */ }
  return empty
}

let state: State = load()
const listeners = new Set<() => void>()
let onLocalChange: () => void = () => {}
/** Le module de synchronisation s'abonne ici pour être prévenu des modifications locales. */
export const setLocalChangeHandler = (fn: () => void) => { onLocalChange = fn }

function commit(next: State, local = true) {
  state = next
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* quota / mode privé */ }
  listeners.forEach((l) => l())
  if (local) onLocalChange()
}

// Synchronisation entre onglets
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) { state = load(); listeners.forEach((l) => l()) }
  })
  navigator.storage?.persist?.().catch(() => {})
}

const uid = () =>
  crypto.randomUUID?.() ??
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })

const mark = (ids: string[], base = state.pending) => {
  const now = Date.now()
  const p = { ...base }
  for (const id of ids) p[id] = now
  return p
}
const without = (rec: Record<string, number>, ids: Iterable<string>) => {
  const r = { ...rec }
  for (const id of ids) delete r[id]
  return r
}
const sortSales = (a: Sale[]) => a.sort((x, y) => x.ts - y.ts)
const shared = (s: State): SharedData => ({ dailyGoal: s.settings.dailyGoal, monthlyGoal: s.settings.monthlyGoal, profile: s.profile })

export const actions = {
  add(amount: number, ts = Date.now()): Sale {
    const sale = { id: uid(), amount, prime: primeFor(amount), ts }
    commit({ ...state, sales: [...state.sales, sale], pending: mark([sale.id]) })
    return sale
  },
  update(id: string, amount: number) {
    commit({
      ...state,
      sales: state.sales.map((s) => (s.id === id ? { ...s, amount, prime: primeFor(amount) } : s)),
      pending: mark([id]),
    })
  },
  remove(id: string) {
    commit({
      ...state,
      sales: state.sales.filter((s) => s.id !== id),
      deleted: { ...state.deleted, [id]: Date.now() },
      pending: mark([id]),
    })
  },
  restore(sale: Sale) {
    commit({ ...state, sales: sortSales([...state.sales, sale]), deleted: without(state.deleted, [sale.id]), pending: mark([sale.id]) })
  },
  setSettings(patch: Partial<Settings>) {
    const touchesShared = 'dailyGoal' in patch || 'monthlyGoal' in patch
    commit({ ...state, settings: { ...state.settings, ...patch }, sharedDirty: touchesShared ? Date.now() : state.sharedDirty }, touchesShared)
  },
  setProfile(patch: Partial<Profile>) {
    commit({ ...state, profile: { ...state.profile, ...patch }, sharedDirty: Date.now() })
  },
  importAll(data: unknown): number {
    const d = data as Partial<State>
    if (!d || !Array.isArray(d.sales)) throw new Error('Fichier invalide')
    const clean = d.sales
      .filter((s): s is Sale => !!s && typeof s.amount === 'number' && typeof s.ts === 'number')
      .map((s) => ({ id: s.id || uid(), amount: Math.round(s.amount), ts: s.ts, prime: primeFor(s.amount) }))
    const known = new Set(state.sales.map((s) => s.id))
    const fresh = clean.filter((s) => !known.has(s.id))
    commit({
      ...state,
      sales: sortSales([...state.sales, ...fresh]),
      pending: mark(fresh.map((s) => s.id)),
      settings: { ...state.settings, ...(d.settings ?? {}) },
      profile: { ...state.profile, ...(d.profile ?? {}) },
      sharedDirty: d.settings || d.profile ? Date.now() : state.sharedDirty,
    })
    return fresh.length
  },
  /** Données exportables (sans les métadonnées de synchronisation). */
  exportAll: () => ({ version: 1 as const, sales: state.sales, settings: state.settings, profile: state.profile }),
  wipe() {
    const ids = state.sales.map((s) => s.id)
    const now = Date.now()
    const deleted = { ...state.deleted }
    for (const id of ids) deleted[id] = now
    commit({ ...state, sales: [], deleted, pending: mark(ids) })
  },
}

/** API réservée au moteur de synchronisation. */
export const syncApi = {
  snapshot() {
    const byId = new Map(state.sales.map((s) => [s.id, s]))
    const rows = Object.keys(state.pending).map((id) => {
      const s = byId.get(id)
      return s ? { id, amount: s.amount, prime: s.prime, ts: s.ts, deleted: false } : state.deleted[id] ? { id, deleted: true } : null
    }).filter(Boolean) as ({ id: string; amount: number; prime: number; ts: number; deleted: false } | { id: string; deleted: true })[]
    return { rows, marks: { ...state.pending }, shared: shared(state), sharedDirty: state.sharedDirty }
  },
  /** Retire des « en attente » les modifs envoyées, sauf si elles ont changé entre-temps. */
  acknowledge(marks: Record<string, number>, sharedMark?: number) {
    const pending = { ...state.pending }
    const deleted = { ...state.deleted }
    for (const [id, t] of Object.entries(marks)) if (pending[id] === t) { delete pending[id]; delete deleted[id] }
    const sharedDirty = sharedMark !== undefined && state.sharedDirty === sharedMark ? 0 : state.sharedDirty
    commit({ ...state, pending, deleted, sharedDirty }, false)
  },
  /** Fusionne des lignes venues du serveur. Une modif locale en attente est prioritaire. */
  applyRemote(rows: { id: string; amount: number; prime: number; ts: number; deleted: boolean }[]) {
    if (!rows.length) return
    const byId = new Map(state.sales.map((s) => [s.id, s]))
    let changed = false
    for (const r of rows) {
      if (state.pending[r.id]) continue
      if (r.deleted) { if (byId.delete(r.id)) changed = true }
      else {
        const cur = byId.get(r.id)
        if (!cur || cur.amount !== r.amount || cur.ts !== Number(r.ts) || cur.prime !== r.prime) {
          byId.set(r.id, { id: r.id, amount: r.amount, prime: r.prime, ts: Number(r.ts) }); changed = true
        }
      }
    }
    if (changed) commit({ ...state, sales: sortSales([...byId.values()]) }, false)
  },
  applyShared(d: SharedData) {
    if (state.sharedDirty) return
    commit({
      ...state,
      settings: { ...state.settings, dailyGoal: d.dailyGoal ?? state.settings.dailyGoal, monthlyGoal: d.monthlyGoal ?? state.settings.monthlyGoal },
      profile: { ...EMPTY_PROFILE, ...d.profile },
    }, false)
  },
  /** Première connexion d'un compte sur cet appareil : tout l'historique local est à envoyer. */
  markAllPending() {
    commit({ ...state, pending: mark(state.sales.map((s) => s.id)) }, false)
  },
  pendingCount: () => Object.keys(state.pending).length + (state.sharedDirty ? 1 : 0),
}

const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l) }
export const useStore = () => useSyncExternalStore(subscribe, () => state)
