import { AlertTriangle, Cloud, CloudOff, LogOut, Mail, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { sendCode, signOut, syncConfigured, syncNow, useSyncStatus, verifyCode } from '../lib/sync'
import { toast } from '../lib/toast'
import { Sheet } from './Sheet'
import { Card, SectionTitle } from './ui'

function ago(ts: number | null) {
  if (!ts) return 'jamais'
  const s = Math.round((Date.now() - ts) / 1000)
  if (s < 10) return "à l'instant"
  if (s < 60) return `il y a ${s} s`
  if (s < 3600) return `il y a ${Math.round(s / 60)} min`
  return new Date(ts).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function SyncSection() {
  const st = useSyncStatus()
  const [open, setOpen] = useState(false)
  const [, tick] = useState(0)
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 15_000); return () => clearInterval(t) }, [])

  if (!syncConfigured) {
    return (
      <>
        <SectionTitle>Synchronisation</SectionTitle>
        <Card className="flex gap-3 px-4 py-3.5 text-[14px] text-label-2">
          <CloudOff size={20} className="shrink-0 mt-0.5" />
          <p>Non configurée sur ce déploiement : les données restent sur cet appareil.</p>
        </Card>
      </>
    )
  }

  const signedIn = st.phase !== 'off'
  const line =
    st.phase === 'syncing' ? 'Synchronisation…'
    : st.phase === 'offline' ? `Hors ligne${st.pending ? ` · ${st.pending} modification${st.pending > 1 ? 's' : ''} en attente` : ''}`
    : st.phase === 'error' ? `Erreur : ${st.error}`
    : st.pending ? `${st.pending} modification${st.pending > 1 ? 's' : ''} en attente`
    : `À jour · ${ago(st.lastSync)}`

  return (
    <>
      <SectionTitle>Synchronisation</SectionTitle>
      {signedIn ? (
        <Card className="divide-y divide-separator overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5">
            {st.phase === 'error' ? <AlertTriangle size={20} className="text-red shrink-0" />
              : st.phase === 'offline' ? <CloudOff size={20} className="text-label-2 shrink-0" />
              : <Cloud size={20} className="text-green shrink-0" />}
            <span className="flex-1 min-w-0">
              <span className="block text-[16px] truncate">{st.email}</span>
              <span className={`block text-[13px] truncate ${st.phase === 'error' ? 'text-red' : 'text-label-2'}`} aria-live="polite">{line}</span>
            </span>
          </div>
          <button onClick={() => syncNow()} disabled={st.phase === 'syncing'}
            className="w-full flex items-center gap-3 px-4 min-h-[52px] text-left active:bg-fill transition-colors disabled:opacity-60">
            <RefreshCw size={20} className={`text-accent-text ${st.phase === 'syncing' ? 'animate-spin' : ''}`} />
            <span className="text-[16px]">Synchroniser maintenant</span>
          </button>
          <button onClick={async () => {
            if (st.pending && !confirm(`${st.pending} modification(s) pas encore envoyée(s). Se déconnecter quand même ?`)) return
            await signOut(); toast('Déconnecté · les données restent sur cet appareil')
          }} className="w-full flex items-center gap-3 px-4 min-h-[52px] text-left text-red active:bg-fill transition-colors">
            <LogOut size={20} /><span className="text-[16px]">Se déconnecter</span>
          </button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <button onClick={() => setOpen(true)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-fill transition-colors">
            <Cloud size={20} className="text-accent-text shrink-0" />
            <span className="flex-1">
              <span className="block text-[16px]">Activer la synchronisation</span>
              <span className="block text-[13px] text-label-2">Retrouvez vos ventes sur tous vos appareils</span>
            </span>
          </button>
        </Card>
      )}
      <SignInSheet open={open} onClose={() => setOpen(false)} />
    </>
  )
}

function SignInSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Synchroniser mes appareils">
      {open && <SignInForm onDone={onClose} />}
    </Sheet>
  )
}

function SignInForm({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim())

  const submit = async () => {
    setErr(null); setBusy(true)
    try {
      if (step === 'email') { await sendCode(email.trim()); setStep('code') }
      else { await verifyCode(email.trim(), code); toast('Synchronisation activée'); onDone() }
    } catch (e) {
      const m = (e as Error).message || ''
      setErr(/expired|invalid|token/i.test(m) ? 'Code invalide ou expiré.' : /rate|seconds/i.test(m) ? 'Trop de demandes, réessayez dans une minute.' : navigator.onLine ? m : 'Pas de connexion internet.')
    } finally { setBusy(false) }
  }

  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void submit() }}>
      <p className="text-[14px] text-label-2 text-center px-2">
        {step === 'email'
          ? "Pas de mot de passe : vous recevrez un code par e-mail. Utilisez la même adresse sur chaque appareil."
          : <>Code envoyé à <b className="text-label">{email.trim()}</b>. Pensez à vérifier les spams.</>}
      </p>
      {step === 'email' ? (
        <label className="flex items-center gap-3 rounded-2xl bg-fill px-4 min-h-[52px]">
          <Mail size={18} className="text-label-2 shrink-0" />
          <input type="email" inputMode="email" autoComplete="email" autoFocus placeholder="vous@exemple.fr" value={email}
            onChange={(e) => setEmail(e.target.value)} aria-label="Adresse e-mail"
            className="flex-1 min-w-0 bg-transparent text-[16px] text-label placeholder:text-label-3 outline-none py-3" />
        </label>
      ) : (
        <input inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={8} placeholder="••••••" value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} aria-label="Code reçu par e-mail"
          className="w-full rounded-2xl bg-fill px-4 h-16 text-center num text-[30px] tracking-[0.4em] font-semibold text-label placeholder:text-label-3 outline-none" />
      )}
      {err && <p role="alert" className="text-[14px] text-red text-center">{err}</p>}
      <button type="submit" disabled={busy || (step === 'email' ? !emailOk : code.length < 6)}
        className="press w-full h-14 rounded-2xl bg-accent text-white text-[17px] font-semibold disabled:opacity-40">
        {busy ? 'Patientez…' : step === 'email' ? 'Recevoir le code' : 'Valider'}
      </button>
      {step === 'code' && (
        <button type="button" onClick={() => { setStep('email'); setCode(''); setErr(null) }} className="w-full text-[14px] text-accent-text font-medium">
          Changer d'adresse
        </button>
      )}
    </form>
  )
}
