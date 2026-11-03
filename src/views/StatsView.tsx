import { ChevronLeft, ChevronRight, Download, Trophy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EditSaleSheet } from '../components/EditSaleSheet'
import { SaleRow } from '../components/SaleRow'
import { Card, Progress, SectionTitle, Stat } from '../components/ui'
import { dayKey, fmtCents, fmtDayLong, fmtEuros, fmtMonth, monthKey } from '../lib/format'
import { exportCsv } from '../lib/export'
import { groupByDay, summarize, tierDistribution } from '../lib/stats'
import { useStore, type Sale } from '../lib/store'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const TIER_ROWS = [
  { prime: 25, label: '≥ 300 €', tone: 'tier-4' },
  { prime: 15, label: '≥ 200 €', tone: 'tier-3' },
  { prime: 8, label: '≥ 160 €', tone: 'tier-2' },
  { prime: 5, label: '≥ 130 €', tone: 'tier-1' },
  { prime: 0, label: '< 130 €', tone: 'tier-0' },
]

export function StatsView() {
  const { sales, settings } = useStore()
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const mk = monthKey(cursor)
  const isCurrent = mk === monthKey()
  const monthSales = useMemo(() => sales.filter((s) => monthKey(s.ts) === mk), [sales, mk])
  const sum = useMemo(() => summarize(monthSales), [monthSales])
  const byDay = useMemo(() => groupByDay(monthSales), [monthSales])
  const dist = useMemo(() => tierDistribution(monthSales), [monthSales])
  const [selected, setSelected] = useState<string | null>(null)
  const [editing, setEditing] = useState<Sale | null>(null)

  const dayStats = useMemo(() => {
    const m = new Map<string, number>()
    byDay.forEach((list, k) => m.set(k, summarize(list).primes))
    return m
  }, [byDay])
  const maxDay = Math.max(1, ...dayStats.values())
  const best = [...dayStats.entries()].sort((a, b) => b[1] - a[1])[0]
  const workedDays = byDay.size

  // Grille du calendrier (semaine commençant le lundi)
  const first = new Date(cursor)
  const offset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
  const todayKey = dayKey()
  const cells: (string | null)[] = [...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => dayKey(new Date(cursor.getFullYear(), cursor.getMonth(), i + 1)))]

  const sel = selected && selected.startsWith(mk) ? selected : null
  const selSales = sel ? byDay.get(sel) ?? [] : []
  const selSum = summarize(selSales)

  const shift = (n: number) => { setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1)); setSelected(null) }

  return (
    <div className="view-enter max-w-[920px] mx-auto">
      <header className="flex items-center justify-between pt-2 px-1">
        <button onClick={() => shift(-1)} aria-label="Mois précédent" className="press glass h-10 w-10 rounded-full flex items-center justify-center">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-[22px] font-bold tracking-tight">{fmtMonth(mk)}</h1>
          {!isCurrent && <button onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)) }} className="text-[13px] text-accent font-medium">Revenir à ce mois</button>}
        </div>
        <button onClick={() => shift(1)} disabled={isCurrent} aria-label="Mois suivant"
          className="press glass h-10 w-10 rounded-full flex items-center justify-center disabled:opacity-30">
          <ChevronRight size={20} />
        </button>
      </header>

      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        <div>
          <Card strong className="mt-5 p-5">
            <p className="text-[13px] text-label-2 font-medium">Primes du mois</p>
            <p className="num text-[44px] font-bold tracking-tight leading-tight" style={{ color: sum.primes ? 'var(--green)' : undefined }}>
              {fmtEuros(sum.primes)}
            </p>
            {settings.monthlyGoal > 0 && (
              <div className="mt-3">
                <Progress value={sum.primes} goal={settings.monthlyGoal} />
                <p className="text-[12px] text-label-2 mt-1.5 num">
                  {Math.round((sum.primes / settings.monthlyGoal) * 100)} % de l'objectif ({fmtEuros(settings.monthlyGoal)})
                  {isCurrent && sum.primes < settings.monthlyGoal && workedDays > 0 &&
                    ` · rythme actuel : ${fmtEuros(Math.round((sum.primes / new Date().getDate()) * daysInMonth))} projetés`}
                </p>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-2 gap-2.5 mt-2.5">
            <Stat label="Ventes éligibles" value={sum.eligible} sub={`sur ${sum.count} ventes`} />
            <Stat label="Panier moyen" value={sum.count ? fmtCents(sum.avg) : '—'} sub={`CA ${fmtCents(sum.revenue)}`} />
            <Stat label="Jours travaillés" value={workedDays} sub={workedDays ? `${fmtEuros(Math.round(sum.primes / workedDays))} / jour` : '—'} />
            <Stat label="Meilleur jour" value={best ? fmtEuros(best[1]) : '—'}
              sub={best ? <span className="inline-flex items-center gap-1"><Trophy size={11} />{fmtDayLong(best[0]).split(' ').slice(0, 2).join(' ')}</span> : undefined} />
          </div>

          <SectionTitle>Répartition par palier</SectionTitle>
          <Card className="p-4 space-y-2.5">
            {TIER_ROWS.map((t) => {
              const n = dist[t.prime] ?? 0
              return (
                <div key={t.prime} className="grid grid-cols-[64px_1fr_70px] items-center gap-3 text-[13px]">
                  <span className="text-label-2 num">{t.label}</span>
                  <div className="h-2.5 rounded-full bg-fill overflow-hidden">
                    <div className={`${t.tone} dot h-full rounded-full transition-[width] duration-700 ease-spring`}
                      style={{ width: `${sum.count ? (n / sum.count) * 100 : 0}%` }} />
                  </div>
                  <span className="text-right num"><b className="font-semibold">{n}</b> <span className="text-label-3">· {t.prime} €</span></span>
                </div>
              )
            })}
          </Card>
        </div>

        <div>
          <SectionTitle right={monthSales.length > 0 && (
            <button onClick={() => exportCsv(monthSales, mk)} className="press text-[14px] text-accent font-medium flex items-center gap-1">
              <Download size={15} /> CSV
            </button>
          )}>Calendrier</SectionTitle>
          <Card className="p-3">
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-label-3 mb-1">
              {WEEKDAYS.map((d, i) => <span key={i}>{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((k, i) => {
                if (!k) return <span key={i} />
                const p = dayStats.get(k)
                const has = byDay.has(k)
                const future = k > todayKey
                const isSel = k === sel
                const intensity = p ? 0.15 + 0.6 * (p / maxDay) : 0
                return (
                  <button key={k} disabled={future} onClick={() => setSelected(isSel ? null : k)}
                    aria-label={`${fmtDayLong(k)}${has ? `, ${p} euros de primes` : ''}`}
                    className={`press aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors
                      ${isSel ? 'ring-2 ring-accent' : k === todayKey ? 'ring-1 ring-label-3' : ''} ${future ? 'opacity-30' : ''}`}
                    style={{ background: has ? `color-mix(in srgb, var(--green) ${intensity * 100}%, transparent)` : 'var(--fill)' }}>
                    <span className={`text-[13px] num ${k === todayKey ? 'font-bold' : 'font-medium'}`}>{Number(k.slice(-2))}</span>
                    {has && <span className="text-[9.5px] num font-semibold leading-none opacity-80">{p}€</span>}
                  </button>
                )
              })}
            </div>
          </Card>

          {sel ? (
            <div className="anim-rise">
              <SectionTitle right={<span className="text-[13px] text-label-2 num">{selSum.count} ventes · {selSum.eligible} éligibles</span>}>
                {fmtDayLong(sel)}
              </SectionTitle>
              <Card className="overflow-hidden">
                <div className="flex justify-between px-4 py-3 border-b border-separator text-[14px] num">
                  <span className="text-label-2">Primes <b className="text-green font-semibold">{fmtEuros(selSum.primes)}</b></span>
                  <span className="text-label-2">Panier moyen <b className="text-label font-semibold">{selSum.count ? fmtCents(selSum.avg) : '—'}</b></span>
                </div>
                {selSales.length ? (
                  <ul className="divide-y divide-separator">
                    {selSales.map((s, i) => <SaleRow key={s.id} sale={s} index={i + 1} onClick={() => setEditing(s)} />)}
                  </ul>
                ) : <p className="p-6 text-center text-[14px] text-label-2">Aucune vente ce jour-là.</p>}
              </Card>
            </div>
          ) : (
            <p className="text-center text-[12px] text-label-3 mt-3">Touchez un jour pour voir le détail.</p>
          )}
        </div>
      </div>
      <EditSaleSheet sale={editing} onClose={() => setEditing(null)} />
    </div>
  )
}
