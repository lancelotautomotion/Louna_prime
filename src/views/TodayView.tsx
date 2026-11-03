import { Check, Inbox } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AmountDisplay } from '../components/AmountDisplay'
import { EditSaleSheet } from '../components/EditSaleSheet'
import { Numpad } from '../components/Numpad'
import { SaleRow } from '../components/SaleRow'
import { Card, Progress, Ring, SectionTitle, Stat } from '../components/ui'
import { dayKey, fmtCents, fmtDayLong, fmtEuros } from '../lib/format'
import { tap } from '../lib/haptics'
import { summarize } from '../lib/stats'
import { actions, useStore, type Sale } from '../lib/store'
import { toast } from '../lib/toast'
import { keyToPad, useAmountInput } from '../lib/useAmountInput'

export function TodayView() {
  const { sales, settings, profile } = useStore()
  const today = dayKey()
  const todays = useMemo(() => sales.filter((s) => dayKey(s.ts) === today), [sales, today])
  const sum = useMemo(() => summarize(todays), [todays])
  const input = useAmountInput()
  const [editing, setEditing] = useState<Sale | null>(null)
  const [freshId, setFreshId] = useState<string | null>(null)
  const [bump, setBump] = useState(0)
  const valid = Number.isFinite(input.cents) && input.cents > 0

  const submitRef = useRef<() => void>(() => {})
  submitRef.current = () => {
    if (!valid) return
    const before = sum.primes
    const sale = actions.add(input.cents)
    input.clear()
    setFreshId(sale.id); setBump((b) => b + 1)
    tap(sale.prime ? [12, 30, 12] : 10)
    const goal = settings.dailyGoal
    if (goal > 0 && before < goal && before + sale.prime >= goal) {
      toast(`Objectif du jour atteint : ${fmtEuros(before + sale.prime)} 🎉`, undefined, 4500)
    } else {
      toast(sale.prime ? `Vente ajoutée · +${sale.prime} €` : 'Vente ajoutée', {
        label: 'Annuler', run: () => actions.remove(sale.id),
      })
    }
  }

  // Clavier physique (ordinateur) : chiffres, virgule, ⌫, Entrée, Échap
  useEffect(() => {
    if (editing) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if ((e.target as HTMLElement)?.closest('input,textarea')) return
      if (e.key === 'Enter') { e.preventDefault(); submitRef.current(); return }
      if (e.key === 'Escape') { input.clear(); return }
      const k = keyToPad(e); if (k) { e.preventDefault(); input.press(k) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing, input.press, input.clear])

  const list = [...todays].reverse()

  return (
    <div className="view-enter lg:grid lg:grid-cols-[minmax(360px,420px)_1fr] lg:gap-8 lg:items-start">
      {/* ───── Colonne saisie ───── */}
      <div className="lg:sticky lg:top-24 space-y-3">
        <header className="px-1 pt-1 lg:pt-0">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-label-2">
            {profile.firstName ? `Bonjour ${profile.firstName} · ` : ''}{fmtDayLong(today)}
          </p>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="sr-only">Primes du jour</h1>
              <p key={bump} className={`num text-[38px] lg:text-[44px] leading-tight font-bold tracking-tight ${bump ? 'anim-pop' : ''}`}
                style={{ color: sum.primes ? 'var(--green)' : undefined }}>
                {fmtEuros(sum.primes)}
              </p>
            </div>
            {settings.dailyGoal > 0 && (
              <Ring value={sum.primes} goal={settings.dailyGoal} size={54} stroke={6}>
                <span className="num text-[11px] font-semibold text-label-2">
                  {Math.min(100, Math.round((sum.primes / settings.dailyGoal) * 100))}%
                </span>
              </Ring>
            )}
          </div>
          {settings.dailyGoal > 0 && (
            <p className="text-[12px] text-label-2 num">
              {sum.primes >= settings.dailyGoal ? 'Objectif atteint, bravo !' : `Encore ${fmtEuros(settings.dailyGoal - sum.primes)} pour l'objectif de ${fmtEuros(settings.dailyGoal)}`}
            </p>
          )}
        </header>

        <Card strong className="p-3.5 pt-4 space-y-3 lg:p-4 lg:pt-6 lg:space-y-4">
          <AmountDisplay value={input.value} cents={input.cents} />
          <Numpad onKey={input.press} onClear={input.clear} />
          <button onClick={() => submitRef.current()} disabled={!valid}
            className="press w-full h-[clamp(48px,7.5dvh,56px)] rounded-2xl bg-accent text-white text-[17px] font-semibold flex items-center justify-center gap-2
              disabled:opacity-35 disabled:active:scale-100 shadow-[0_8px_24px_-8px_var(--accent)]">
            <Check size={20} strokeWidth={2.6} /> Valider la vente
          </button>
          <p className="hidden lg:block text-center text-[12px] text-label-3">
            Tapez au clavier · <kbd className="font-sans">Entrée</kbd> pour valider · <kbd className="font-sans">Échap</kbd> pour effacer
          </p>
        </Card>
      </div>

      {/* ───── Colonne tableau de bord ───── */}
      <div>
        <SectionTitle>Aujourd'hui</SectionTitle>
        <div className="grid grid-cols-3 gap-2.5">
          <Stat label="Ventes" value={sum.count} />
          <Stat label="Éligibles" value={sum.eligible}
            sub={sum.count ? `${Math.round((sum.eligible / sum.count) * 100)} %` : '—'} />
          <Stat label="Panier moyen" value={sum.count ? fmtCents(sum.avg).replace(/,\d+/, '') : '—'} />
        </div>
        {settings.dailyGoal > 0 && (
          <div className="glass rounded-[22px] px-4 py-3.5 mt-2.5">
            <div className="flex justify-between text-[12px] text-label-2 mb-2 num">
              <span>Objectif du jour</span><span>{fmtEuros(sum.primes)} / {fmtEuros(settings.dailyGoal)}</span>
            </div>
            <Progress value={sum.primes} goal={settings.dailyGoal} />
          </div>
        )}

        <SectionTitle right={sum.count > 0 && <span className="text-[13px] text-label-2 num">CA {fmtCents(sum.revenue)}</span>}>
          Ventes du jour
        </SectionTitle>
        {list.length === 0 ? (
          <Card className="py-10 flex flex-col items-center text-center text-label-2">
            <Inbox size={30} strokeWidth={1.5} className="text-label-3 mb-2" />
            <p className="text-[15px] font-medium text-label">Aucune vente pour l'instant</p>
            <p className="text-[13px] mt-1">Saisissez un montant, il s'affichera ici.</p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-separator">
              {list.map((s, i) => (
                <SaleRow key={s.id} sale={s} index={list.length - i} fresh={s.id === freshId} onClick={() => setEditing(s)} />
              ))}
            </ul>
          </Card>
        )}
        <p className="text-center text-[12px] text-label-3 mt-3">Touchez une vente pour la corriger ou la supprimer.</p>
      </div>

      <EditSaleSheet sale={editing} onClose={() => setEditing(null)} />
    </div>
  )
}
