import { ArrowUpRight } from 'lucide-react'
import { nextTier, primeFor, tierTone } from '../lib/bonus'
import { fmtCents } from '../lib/format'

export function AmountDisplay({ value, cents, compact = false }: { value: string; cents: number; compact?: boolean }) {
  const valid = Number.isFinite(cents) && cents > 0
  const prime = valid ? primeFor(cents) : 0
  const next = valid ? nextTier(cents) : null
  return (
    <div className="flex flex-col items-center text-center select-none">
      <div className={`num font-semibold tracking-tight flex items-baseline gap-1 ${compact ? 'text-5xl' : 'text-[clamp(44px,8dvh,60px)] lg:text-7xl'} ${value ? 'text-label' : 'text-label-3'}`}
        aria-live="polite">
        <span className="tabular-nums">{value || '0'}</span>
        <span className="text-[0.55em] font-medium text-label-2">€</span>
      </div>
      <div className="h-7 mt-1.5 flex items-center justify-center gap-2 text-[13px]">
        {valid ? (
          <>
            <span key={prime} className={`chip ${tierTone(prime)} anim-pop rounded-full px-2.5 py-1 font-semibold num`}>
              {prime ? `+${prime} € de prime` : 'Pas de prime'}
            </span>
            {next && next.missingCents <= 6000 && (
              <span className="text-label-2 flex items-center gap-0.5 anim-fade">
                <ArrowUpRight size={14} />encore {fmtCents(next.missingCents)} → +{next.prime} €
              </span>
            )}
          </>
        ) : (
          <span className="text-label-3">Saisissez le montant TTC</span>
        )}
      </div>
    </div>
  )
}
