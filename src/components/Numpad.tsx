import { Delete } from 'lucide-react'
import type { PadKey } from '../lib/useAmountInput'
import { tap } from '../lib/haptics'

const KEYS: PadKey[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'del']

export function Numpad({ onKey, onClear }: { onKey: (k: PadKey) => void; onClear: () => void }) {
  let hold: ReturnType<typeof setTimeout> | undefined
  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Pavé numérique">
      {KEYS.map((k) => (
        <button
          key={k}
          type="button"
          aria-label={k === 'del' ? 'Effacer (appui long : tout effacer)' : k === ',' ? 'Virgule' : k}
          onClick={() => { tap(); onKey(k) }}
          onPointerDown={k === 'del' ? () => { hold = setTimeout(() => { tap(20); onClear() }, 450) } : undefined}
          onPointerUp={k === 'del' ? () => clearTimeout(hold) : undefined}
          onPointerLeave={k === 'del' ? () => clearTimeout(hold) : undefined}
          className={`press h-[clamp(44px,7.2dvh,58px)] rounded-2xl text-[26px] font-normal num flex items-center justify-center
            ${k === 'del' || k === ',' ? 'text-label active:bg-fill' : 'bg-fill active:bg-fill-strong'}`}
        >
          {k === 'del' ? <Delete size={24} strokeWidth={1.75} /> : k}
        </button>
      ))}
    </div>
  )
}
