import { dismissToast, useToast } from '../lib/toast'

export function ToastHost() {
  const t = useToast()
  if (!t) return null
  return (
    <div key={t.id} role="status"
      className="glass-strong anim-toast fixed left-1/2 z-[60] top-[max(10px,env(safe-area-inset-top))] lg:top-auto lg:bottom-8
        flex items-center gap-3 rounded-full pl-5 pr-2 py-2 text-[15px] max-w-[calc(100vw-32px)]">
      <span className="truncate">{t.text}</span>
      {t.action ? (
        <button className="press rounded-full px-3.5 py-1.5 font-semibold text-accent bg-fill"
          onClick={() => { t.action!.run(); dismissToast() }}>{t.action.label}</button>
      ) : <span className="w-2" />}
    </div>
  )
}
