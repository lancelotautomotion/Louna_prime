# Primes — suivi des ventes & primes journalières

PWA minimaliste (style Apple / liquid glass) pour saisir ses ventes au fil de la journée et suivre ses primes automatiquement. 100 % hors ligne, données stockées sur l'appareil.

## Paliers (par panier TTC)
| Panier TTC | Prime |
|---|---|
| < 130 € | 0 € |
| ≥ 130 € | 5 € |
| ≥ 160 € | 8 € |
| ≥ 200 € | 15 € |
| ≥ 300 € | 25 € |

Modifiables dans `src/lib/bonus.ts`.

## Stack
Vite 8 · React 19 · TypeScript · Tailwind CSS v4 · lucide-react · vite-plugin-pwa (Workbox) · Vercel.

## Structure
```
src/
  lib/        bonus.ts (paliers) · store.ts (état + localStorage) · stats.ts · format.ts
              export.ts (CSV/JSON) · useAmountInput.ts · toast.ts · haptics.ts · install.ts
  components/ Numpad · AmountDisplay · SaleRow · EditSaleSheet · Sheet · TabBar · ToastHost · ui.tsx
  views/      TodayView (saisie + dashboard) · StatsView (mois + calendrier) · SettingsView
public/       favicon.svg · icons/ (générées par `npm run icons`)
vercel.json   rewrites SPA + en-têtes de cache du service worker
```

## Développement
```bash
npm install
npm run dev       # http://localhost:5173
npm run build && npm run preview   # tester la PWA / le hors ligne
```

Raccourcis clavier (ordinateur) : chiffres, `,`, `⌫`, `Entrée` pour valider, `Échap` pour effacer.
