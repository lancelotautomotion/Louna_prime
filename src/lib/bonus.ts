/** Paliers de prime par panier TTC (en euros). Le palier le plus haut atteint s'applique. */
export const TIERS = [
  { min: 300, prime: 25 },
  { min: 200, prime: 15 },
  { min: 160, prime: 8 },
  { min: 130, prime: 5 },
] as const

/** Montant en centimes → prime en euros (entier). */
export function primeFor(amountCents: number): number {
  const euros = amountCents / 100
  for (const t of TIERS) if (euros >= t.min) return t.prime
  return 0
}

/** Palier suivant à atteindre pour ce montant, ou null si déjà au maximum. */
export function nextTier(amountCents: number): { missingCents: number; prime: number; min: number } | null {
  const ordered = [...TIERS].reverse()
  for (const t of ordered) {
    if (amountCents < t.min * 100) return { missingCents: t.min * 100 - amountCents, prime: t.prime, min: t.min }
  }
  return null
}

/** Couleur sémantique associée à une prime (pour les pastilles). */
export function tierTone(prime: number): string {
  switch (prime) {
    case 25: return 'tier-4'
    case 15: return 'tier-3'
    case 8: return 'tier-2'
    case 5: return 'tier-1'
    default: return 'tier-0'
  }
}
