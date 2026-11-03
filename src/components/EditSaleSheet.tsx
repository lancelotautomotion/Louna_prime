import { Trash2 } from 'lucide-react'
import { useEffect } from 'react'
import { centsToInput, fmtTime } from '../lib/format'
import { tap } from '../lib/haptics'
import { actions, type Sale } from '../lib/store'
import { toast } from '../lib/toast'
import { keyToPad, useAmountInput } from '../lib/useAmountInput'
import { AmountDisplay } from './AmountDisplay'
import { Numpad } from './Numpad'
import { Sheet } from './Sheet'

export function EditSaleSheet({ sale, onClose }: { sale: Sale | null; onClose: () => void }) {
  return (
    <Sheet open={!!sale} onClose={onClose} title={sale ? `Vente de ${fmtTime(sale.ts)}` : ''}>
      {sale && <Editor key={sale.id} sale={sale} onClose={onClose} />}
    </Sheet>
  )
}

function Editor({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const input = useAmountInput(centsToInput(sale.amount))
  const valid = Number.isFinite(input.cents) && input.cents > 0
  const save = () => {
    if (!valid) return
    actions.update(sale.id, input.cents); tap(12); toast('Vente corrigée'); onClose()
  }
  const remove = () => {
    actions.remove(sale.id); tap([10, 40, 10]); onClose()
    toast('Vente supprimée', { label: 'Annuler', run: () => actions.restore(sale) }, 5000)
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') { e.preventDefault(); save(); return }
      const k = keyToPad(e); if (k) { e.preventDefault(); input.press(k) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  return (
    <div className="space-y-4">
      <AmountDisplay value={input.value} cents={input.cents} compact />
      <Numpad onKey={input.press} onClear={input.clear} />
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <button onClick={remove} aria-label="Supprimer la vente"
          className="press h-14 w-14 rounded-2xl flex items-center justify-center text-red bg-[color-mix(in_srgb,var(--red)_12%,transparent)]">
          <Trash2 size={22} />
        </button>
        <button onClick={save} disabled={!valid}
          className="press h-14 rounded-2xl bg-accent text-white text-[17px] font-semibold disabled:opacity-40">
          Enregistrer
        </button>
      </div>
    </div>
  )
}
