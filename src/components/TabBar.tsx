import { BarChart3, Plus, Settings2 } from 'lucide-react'
import type { View } from '../App'
import { tap } from '../lib/haptics'

const TABS: { id: View; label: string; Icon: typeof Plus }[] = [
  { id: 'today', label: 'Saisie', Icon: Plus },
  { id: 'stats', label: 'Historique', Icon: BarChart3 },
  { id: 'settings', label: 'Réglages', Icon: Settings2 },
]

export function TabBar({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <nav aria-label="Navigation principale"
      className="glass-strong fixed z-40 left-1/2 -translate-x-1/2 bottom-[max(12px,env(safe-area-inset-bottom))]
        lg:bottom-auto lg:top-5 flex gap-1 rounded-full p-1.5">
      {TABS.map(({ id, label, Icon }) => {
        const active = view === id
        return (
          <button key={id} onClick={() => { tap(); onChange(id) }} aria-current={active ? 'page' : undefined}
            className={`press relative flex items-center gap-1.5 rounded-full px-4 h-11 text-[14px] font-medium transition-colors
              ${active ? 'bg-fill-strong text-label' : 'text-label-2 hover:text-label'}`}>
            <Icon size={19} strokeWidth={active ? 2.4 : 2} />
            <span className={active ? '' : 'max-sm:sr-only'}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
