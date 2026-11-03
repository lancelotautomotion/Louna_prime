import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { useSyncExternalStore } from 'react'
import { setLocalChangeHandler, syncApi, type SharedData } from './store'

/*
 * Synchronisation multi-appareils via Supabase.
 * - L'app reste 100 % locale (localStorage) et fonctionne hors ligne.
 * - Chaque modification locale est marquée « en attente », puis envoyée dès que possible.
 * - On récupère ensuite les lignes modifiées sur le serveur depuis la dernière synchro.
 * - Les suppressions sont « douces » (deleted = true) pour se propager aux autres appareils.
 */

const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY_ = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
export const syncConfigured = !!(URL_ && KEY_)

export const supabase: SupabaseClient | null = syncConfigured
  ? createClient(URL_!, KEY_!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'primes.auth' },
    })
  : null

type Phase = 'off' | 'idle' | 'syncing' | 'offline' | 'error'
export type SyncStatus = { phase: Phase; email: string | null; lastSync: number | null; error: string | null; pending: number }

const META_KEY = 'primes.sync.meta'
type Meta = { userId: string | null; lastPull: string | null; lastSync: number | null }
const readMeta = (): Meta => {
  try { return { userId: null, lastPull: null, lastSync: null, ...JSON.parse(localStorage.getItem(META_KEY) || '{}') } }
  catch { return { userId: null, lastPull: null, lastSync: null } }
}
let meta = readMeta()
const saveMeta = (patch: Partial<Meta>) => {
  meta = { ...meta, ...patch }
  try { localStorage.setItem(META_KEY, JSON.stringify(meta)) } catch { /* noop */ }
}

let status: SyncStatus = { phase: 'off', email: null, lastSync: meta.lastSync, error: null, pending: syncApi.pendingCount() }
const ls = new Set<() => void>()
const set = (patch: Partial<SyncStatus>) => {
  status = { ...status, pending: syncApi.pendingCount(), ...patch }
  ls.forEach((l) => l())
}
export const useSyncStatus = () => useSyncExternalStore((l) => { ls.add(l); return () => ls.delete(l) }, () => status)

let userId: string | null = null
let running = false
let again = false
let timer: ReturnType<typeof setTimeout> | undefined

const CHUNK = 500
const PAGE = 1000
const OVERLAP_MS = 15_000 // marge pour ne rater aucune ligne écrite en parallèle

export async function syncNow(): Promise<void> {
  if (!supabase || !userId) return
  if (running) { again = true; return }
  if (!navigator.onLine) { set({ phase: 'offline' }); return }
  running = true
  set({ phase: 'syncing', error: null })
  try {
    // 1) Envoi des ventes modifiées / supprimées
    const snap = syncApi.snapshot()
    for (let i = 0; i < snap.rows.length; i += CHUNK) {
      const rows = snap.rows.slice(i, i + CHUNK).map((r) => ({ user_id: userId, amount: 0, prime: 0, ts: 0, ...r }))
      // Une suppression envoie deleted = true (les montants à 0 sont autorisés par la contrainte SQL).
      const { error } = await supabase.from('sales').upsert(rows, { onConflict: 'user_id,id' })
      if (error) throw error
    }
    syncApi.acknowledge(snap.marks)

    // 2) Récupération des ventes modifiées ailleurs
    const since = meta.lastPull ? new Date(new Date(meta.lastPull).getTime() - OVERLAP_MS).toISOString() : null
    let maxSeen = meta.lastPull
    for (let from = 0; ; from += PAGE) {
      let q = supabase.from('sales').select('id,amount,prime,ts,deleted,updated_at')
        .order('updated_at', { ascending: true }).order('id', { ascending: true }).range(from, from + PAGE - 1)
      if (since) q = q.gt('updated_at', since)
      const { data, error } = await q
      if (error) throw error
      syncApi.applyRemote(data ?? [])
      for (const r of data ?? []) if (!maxSeen || r.updated_at > maxSeen) maxSeen = r.updated_at
      if (!data || data.length < PAGE) break
    }

    // 3) Profil + objectifs (dernier écrit gagne)
    const fresh = syncApi.snapshot()
    if (fresh.sharedDirty) {
      const { error } = await supabase.from('user_data').upsert({ user_id: userId, data: fresh.shared }, { onConflict: 'user_id' })
      if (error) throw error
      syncApi.acknowledge({}, fresh.sharedDirty)
    } else {
      const { data, error } = await supabase.from('user_data').select('data').eq('user_id', userId).limit(1)
      if (error) throw error
      if (data?.[0]) syncApi.applyShared(data[0].data as SharedData)
      else {
        const { error: e2 } = await supabase.from('user_data').upsert({ user_id: userId, data: fresh.shared }, { onConflict: 'user_id' })
        if (e2) throw e2
      }
    }

    const now = Date.now()
    saveMeta({ lastPull: maxSeen, lastSync: now })
    set({ phase: 'idle', lastSync: now })
  } catch (e) {
    const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Erreur inconnue'
    set({ phase: navigator.onLine ? 'error' : 'offline', error: msg })
  } finally {
    running = false
    if (again) { again = false; schedule(300) }
  }
}

function schedule(ms = 800) {
  clearTimeout(timer)
  set({})
  if (userId) timer = setTimeout(syncNow, ms)
}

function onSession(id: string | null, email: string | null) {
  if (!id) {
    userId = null
    set({ phase: 'off', email: null })
    return
  }
  if (meta.userId !== id) {
    // Nouveau compte sur cet appareil : on envoie tout l'historique local et on récupère tout.
    syncApi.markAllPending()
    saveMeta({ userId: id, lastPull: null, lastSync: null })
  }
  userId = id
  set({ email, phase: 'idle', lastSync: meta.lastSync })
  void syncNow()
}

if (supabase && typeof window !== 'undefined') {
  setLocalChangeHandler(() => schedule())
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') return
    // Différé : on évite d'appeler l'API Supabase depuis le callback lui-même.
    setTimeout(() => onSession(session?.user.id ?? null, session?.user.email ?? null), 0)
  })
  window.addEventListener('online', () => void syncNow())
  window.addEventListener('offline', () => set({ phase: userId ? 'offline' : 'off' }))
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void syncNow() })
  setInterval(() => { if (document.visibilityState === 'visible') void syncNow() }, 60_000)
} else {
  setLocalChangeHandler(() => set({}))
}

/* ───────── Connexion par code reçu par e-mail (sans mot de passe) ───────── */

export async function sendCode(email: string) {
  if (!supabase) throw new Error('Synchronisation non configurée')
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
  if (error) throw error
}

export async function verifyCode(email: string, token: string) {
  if (!supabase) throw new Error('Synchronisation non configurée')
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
  if (error) throw error
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut({ scope: 'local' })
  saveMeta({ userId: null, lastPull: null, lastSync: null })
}
