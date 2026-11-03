import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** Feuille modale : bottom sheet sur mobile, panneau centré sur grand écran. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/35 anim-fade backdrop-blur-[2px]" onClick={onClose} />
      <div className="glass-strong sheet-surface anim-sheet relative w-full sm:max-w-[420px] rounded-t-[32px] sm:rounded-[32px] px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-fill-strong sm:hidden" />
        <h3 className="text-center text-[17px] font-semibold mb-4">{title}</h3>
        {children}
      </div>
    </div>,
    document.body,
  )
}
