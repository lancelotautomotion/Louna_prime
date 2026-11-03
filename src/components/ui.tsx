import type { ReactNode } from 'react'

export function Card({ children, className = '', strong = false }: { children: ReactNode; className?: string; strong?: boolean }) {
  return <section className={`${strong ? 'glass-strong' : 'glass'} rounded-[28px] ${className}`}>{children}</section>
}

export function Stat({ label, value, sub, className = '' }: { label: string; value: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={`glass rounded-[22px] px-4 py-3.5 min-w-0 ${className}`}>
      <div className="text-[12px] font-medium text-label-2 truncate">{label}</div>
      <div className="num text-[22px] font-semibold mt-0.5 truncate">{value}</div>
      {sub && <div className="text-[12px] text-label-3 mt-0.5 truncate">{sub}</div>}
    </div>
  )
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between px-1 mb-2 mt-6">
      <h2 className="text-[20px] font-semibold tracking-tight">{children}</h2>
      {right}
    </div>
  )
}

export function Progress({ value, goal, tone = 'var(--green)' }: { value: number; goal: number; tone?: string }) {
  const pct = goal > 0 ? Math.min(1, value / goal) : 0
  return (
    <div className="h-2 rounded-full bg-fill overflow-hidden" role="progressbar" aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-[width] duration-700 ease-spring" style={{ width: `${pct * 100}%`, background: tone }} />
    </div>
  )
}

export function Ring({ value, goal, size = 64, stroke = 7, children }: { value: number; goal: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = goal > 0 ? Math.min(1, value / goal) : 0
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--fill)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--green)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(.32,.72,0,1)' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}
