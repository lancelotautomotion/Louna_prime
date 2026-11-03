# Activer la synchronisation (Supabase) — ~10 minutes

Sans cette configuration, l'app fonctionne normalement mais les données restent sur chaque appareil.

## 1. Créer le projet
1. https://supabase.com → **Start your project** → connexion avec GitHub.
2. **New project** : nom `louna-prime`, mot de passe de base de données (générez-le, vous n'en aurez pas besoin), région **West EU (Paris)** ou **Frankfurt**.
3. Attendre ~1 minute que le projet soit prêt.

## 2. Créer les tables
**SQL Editor** → **New query** → coller tout le contenu de `supabase/schema.sql` → **Run**.
Le message attendu est « Success. No rows returned ».

## 3. Connexion par code (indispensable pour l'iPhone)
**Authentication → Emails** (ou *Email Templates*) :
- Modèle **Magic Link** : remplacer le contenu par
  ```html
  <h2>Votre code Primes</h2>
  <p style="font-size:32px;font-weight:700;letter-spacing:6px">{{ .Token }}</p>
  <p>Saisissez ce code dans l'app. Il expire dans 1 heure.</p>
  ```
- Faire de même pour le modèle **Confirm signup** (utilisé à la toute première connexion).

Facultatif : **Authentication → Sign In / Providers → Email** → *Email OTP Length* = 6.

## 4. Récupérer les clés
**Project Settings → API Keys** (ou *Data API*) :
- **Project URL** → `https://xxxx.supabase.co`
- **anon / publishable key** → clé publique (sans danger côté navigateur : la sécurité est assurée par les règles RLS du SQL).

⚠️ Ne jamais utiliser la clé `service_role` / `secret` dans l'app.

## 5. Brancher Vercel
Dans le dossier du projet :
```bash
npx vercel env add VITE_SUPABASE_URL production
npx vercel env add VITE_SUPABASE_ANON_KEY production
npx vercel --prod
```
(ou Vercel → projet → Settings → Environment Variables, puis *Redeploy*).

Pour le développement local : copier `.env.example` en `.env.local` et remplir les deux valeurs.

## 6. Utiliser
Réglages → **Activer la synchronisation** → e-mail → code reçu → Valider.
À faire une fois sur chaque appareil, **avec la même adresse e-mail**.

### Fonctionnement
- L'app reste utilisable hors ligne ; les modifications sont envoyées au retour du réseau.
- Synchro automatique : après chaque saisie, à l'ouverture de l'app, et toutes les minutes.
- En cas de modification simultanée d'une même vente sur deux appareils, la dernière envoyée l'emporte.
- La première connexion d'un appareil fusionne ses ventes locales avec celles du compte (aucune perte).
- Limite d'envoi des e-mails Supabase gratuits : quelques codes par heure, largement suffisant.
