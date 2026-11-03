import { useCallback, useState } from 'react'
import { parseAmount } from './format'

export type PadKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | ',' | 'del'

/** Saisie d'un montant façon calculette : 5 chiffres max, 2 décimales max, une virgule. */
export function useAmountInput(initial = '') {
  const [value, setValue] = useState(initial)
  const press = useCallback((k: PadKey) => {
    setValue((v) => {
      if (k === 'del') return v.slice(0, -1)
      if (k === ',') return v.includes(',') ? v : (v || '0') + ','
      const [int, dec] = v.split(',')
      if (dec !== undefined) return dec.length >= 2 ? v : v + k
      if (int === '0') return k
      if (int.length >= 5) return v
      return v + k
    })
  }, [])
  const clear = useCallback(() => setValue(''), [])
  return { value, setValue, press, clear, cents: parseAmount(value) }
}

export function keyToPad(e: KeyboardEvent): PadKey | null {
  if (/^[0-9]$/.test(e.key)) return e.key as PadKey
  if (e.key === ',' || e.key === '.') return ','
  if (e.key === 'Backspace') return 'del'
  return null
}
