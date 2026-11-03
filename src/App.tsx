import { useEffect, useState } from 'react'
import { TabBar } from './components/TabBar'
import { ToastHost } from './components/ToastHost'
import { SettingsView } from './views/SettingsView'
import { StatsView } from './views/StatsView'
import { TodayView } from './views/TodayView'

export type View = 'today' | 'stats' | 'settings'
const fromHash = (): View => (['stats', 'settings'].includes(location.hash.slice(1)) ? (location.hash.slice(1) as View) : 'today')

export default function App() {
  const [view, setView] = useState<View>(fromHash)
  useEffect(() => {
    const on = () => setView(fromHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const go = (v: View) => {
    history.replaceState(null, '', v === 'today' ? location.pathname : `#${v}`)
    setView(v); window.scrollTo({ top: 0 })
  }
  return (
    <>
      <div className="ambient" aria-hidden><i /></div>
      <main className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10
        pt-[max(12px,env(safe-area-inset-top))] lg:pt-24 pb-[calc(104px+env(safe-area-inset-bottom))] lg:pb-12">
        {view === 'today' && <TodayView key="today" />}
        {view === 'stats' && <StatsView key="stats" />}
        {view === 'settings' && <SettingsView key="settings" />}
      </main>
      <TabBar view={view} onChange={go} />
      <ToastHost />
    </>
  )
}
