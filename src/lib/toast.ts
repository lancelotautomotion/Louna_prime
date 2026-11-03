import { useSyncExternalStore } from 'react'

export type Toast = { id: number; text: string; action?: { label: string; run: () => void } }
let current: Toast | null = null
let timer: ReturnType<typeof setTimeout> | undefined
const ls = new Set<() => void>()
const emit = () => ls.forEach((l) => l())

export function toast(text: string, action?: Toast['action'], ms = 3500) {
  current = { id: Date.now(), text, action }
  clearTimeout(timer)
  timer = setTimeout(() => { current = null; emit() }, ms)
  emit()
}
export const dismissToast = () => { clearTimeout(timer); current = null; emit() }
export const useToast = () =>
  useSyncExternalStore((l) => { ls.add(l); return () => ls.delete(l) }, () => current)
