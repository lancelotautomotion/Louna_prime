import type { Sale } from './store'
import { dayKey, fmtTime } from './format'

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** CSV compatible Excel FR (séparateur ";" + BOM UTF-8). */
export function exportCsv(sales: Sale[], label: string) {
  const rows = [['Date', 'Heure', 'Panier TTC (€)', 'Prime (€)']]
  for (const s of sales) rows.push([dayKey(s.ts), fmtTime(s.ts), (s.amount / 100).toFixed(2).replace('.', ','), String(s.prime)])
  const total = sales.reduce((a, s) => a + s.prime, 0)
  const ca = sales.reduce((a, s) => a + s.amount, 0)
  rows.push([], ['Total', '', (ca / 100).toFixed(2).replace('.', ','), String(total)])
  const csv = '﻿' + rows.map((r) => r.join(';')).join('\r\n')
  download(`primes-${label}.csv`, csv, 'text/csv;charset=utf-8')
}

export function exportBackup(data: unknown) {
  download(`primes-sauvegarde-${dayKey()}.json`, JSON.stringify(data, null, 2), 'application/json')
}
