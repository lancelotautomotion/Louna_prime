import { ChevronRight } from 'lucide-react'
import { tierTone } from '../lib/bonus'
import { fmtCents, fmtTime } from '../lib/format'
import type { Sale } from '../lib/store'

export function SaleRow({ sale, index, onClick, fresh }: { sale: Sale; index?: number; onClick?: () => void; fresh?: boolean }) {
  return (
    <li className={fresh ? 'anim-rise' : ''}>
      <button onClick={onClick} disabled={!onClick}
        className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-fill transition-colors disabled:cursor-default">
        <span className={`${tierTone(sale.prime)} dot h-2 w-2 rounded-full shrink-0`} />
        <span className="flex-1 min-w-0">
          <span className="num text-[17px] font-medium">{fmtCents(sale.amount)}</span>
          <span className="block text-[12px] text-label-2 num">{index !== undefined && `Vente ${index} · `}{fmtTime(sale.ts)}</span>
        </span>
        <span className={`${tierTone(sale.prime)} chip num rounded-full px-2.5 py-1 text-[13px] font-semibold`}>
          {sale.prime ? `+${sale.prime} €` : '0 €'}
        </span>
        {onClick && <ChevronRight size={16} className="text-label-3 -mr-1" />}
      </button>
    </li>
  )
}
