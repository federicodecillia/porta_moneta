# Progressi Migrazione v3

> Diario operativo. Aggiornare a fine di ogni sessione di lavoro.
> Formato: data | autore | cosa fatto | cosa resta / blockers.

---

## 2026-04-28 — Setup iniziale

**Autore**: Federico + Claude
**Tempo**: ~30 min
**Cosa fatto:**
- Commit baseline v2 su `main` (commit `c697f40`) — `app_gas_v2/`, `DESIGN.md`, `mintlify/`, `scripts/` ora tracciati in git
- Creato branch `migration/nextjs-v3` da main
- Creata cartella `app_gas_v3/`
- Scritto `PLAN.md` (piano operativo completo a 6 fasi)
- Scritto questo file `PROGRESS.md`

**Cosa resta (next session):**
- Fase 0 — Foundation:
  - [ ] Decidere account Vercel (personale vs nuova org)
  - [ ] Decidere account Neon
  - [ ] Decidere se nuovo progetto GCP per OAuth o riuso v2
  - [ ] Scaffold Next.js 15 con TS + Tailwind in `app_gas_v3/`
  - [ ] Creare progetto Vercel + Neon
  - [ ] Configurare Auth.js Google provider
  - [ ] Primo deploy + URL preview funzionante

**Blockers**: nessuno tecnico. Solo decisioni account/org da prendere prima di iniziare la Fase 0.

**Note:**
- v2 resta su `gas.portamoneta.org` invariata e attiva durante tutta la migrazione
- v3 vivrà su URL Vercel (`gas-v3.vercel.app` o equivalente) finché non si fa cutover
- Tempo stimato totale residuo: 10-13 giorni di lavoro effettivo

---

## 2026-04-28 — Fase 0 avviata (foundation locale)

**Autore**: Codex
**Tempo**: ~90 min
**Fase corrente**: Fase 0

**Cosa fatto:**
- Scaffold iniziale Next.js creato e portato in `app_gas_v3/` mantenendo `PLAN.md`, `PROGRESS.md`, `README.md`
- Setup dipendenze fase 0 completato:
  - `next@15`, `react@19`
  - `next-auth@5.0.0-beta.30`
  - `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`
- Configurati file foundation richiesti:
  - `auth.ts`
  - `middleware.ts`
  - `drizzle.config.ts`
  - `.env.example`
  - `app/api/auth/[...nextauth]/route.ts`
  - `/` protetta con redirect a `/login` e visualizzazione `session.user.email` dopo login
- Applicata palette base v2 (orange/teal) in `app/globals.css`
- Validazione locale completata:
  - `npm run lint` ✅
  - `npm run build` ✅

**Cosa resta (Fase 0):**
- [ ] Creare progetto Vercel e collegarlo a `app_gas_v3/` come root
- [ ] Creare progetto Neon e impostare `DATABASE_URL` reale
- [ ] Creare credenziali Google OAuth e impostare `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`
- [ ] Impostare env su Vercel (`DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`)
- [ ] Primo deploy pubblico e verifica login end-to-end in incognito

**Blockers / decisioni aperte:**
- Scelta account/org per Vercel e Neon non definita
- Credenziali OAuth non disponibili nella workspace locale

**Note tecniche:**
- Build stabile su Next `15.5.15`
- `npm run dev` parte su `http://localhost:3000` (nel container appaiono warning `EMFILE` del file watcher, non bloccanti per build/deploy)

---

## Template per nuove entry

```
## YYYY-MM-DD — <titolo breve>

**Autore**:
**Tempo**:
**Fase corrente**:

**Cosa fatto:**
- ...

**Cosa resta:**
- ...

**Blockers / decisioni aperte:**
- ...

**Note tecniche:**
- ...
```

---

## 2026-04-28 — Fase 0 chiusa + Fase 1 (schema/migrazione) completata

**Autore**: Federico + Codex  
**Tempo**: ~3h  
**Fase corrente**: transizione a Fase 2

**Cosa fatto:**
- Progetto Vercel creato con root `app_gas_v3/`
- Auth Google configurata su Vercel (`AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`)
- Deploy v3 validato con login Google end-to-end
- Neon configurato e `DATABASE_URL` impostata su Vercel
- Schema Drizzle completato con 7 tabelle target:
  - `members`, `suppliers`, `order_cycles`, `products`, `orders`, `ledger_entries`, `audit_log`
- `db:push` eseguito con successo su Neon
- Endpoint v2 `exportAll` creato e deployato su Apps Script web app
- Script migrazione `scripts/migrate-from-v2.mjs` creato ed eseguito con successo
- Import dati completato su Neon con conteggi coerenti:
  - `members=30`, `suppliers=18`, `order_cycles=20`, `products=434`, `orders=569`, `ledger_entries=49`, `audit_log=57`

**Cosa resta (next):**
- [ ] Fase 2.1 — bloccare login ai soli membri presenti/attivi in `members`
- [ ] Fase 2.2 — middleware auth/admin routing
- [ ] Fase 2.3+ — shell app (header + bottom nav) e componenti base

**Note tecniche:**
- Script migrazione supporta input da file (`V2_EXPORT_FILE`) o URL (`V2_EXPORT_URL`)
- `catalog_products` esportata da v2 ma non ancora modellata/importata in v3

---

## 2026-04-28 — Fase 2.2 quick completata (routing auth/admin)

**Autore**: Federico + Codex  
**Tempo**: ~35 min  
**Fase corrente**: Fase 2

**Cosa fatto:**
- Middleware v3 attivata su tutte le route app (escluse route tecniche):
  - redirect a `/login` se non autenticato
  - redirect a `/` se autenticato e visita `/login`
  - accesso `/admin` consentito solo a `role=admin`
- Auth.js callbacks estesi:
  - `jwt` aggiunge `role` e `active` da tabella `members`
  - `session` espone `role` e `active` su `session.user`
- Creata pagina placeholder `/admin` protetta server-side

**Validazione locale:**
- `npm run lint` ✅
- `npm run build` ✅

**Cosa resta (next):**
- [ ] Deploy su Vercel di queste modifiche
- [ ] Smoke test cloud:
  - utente non autenticato -> redirect `/login`
  - utente member attivo -> `/` ok
  - utente non admin su `/admin` -> redirect `/`
  - utente admin su `/admin` -> accesso consentito
- [ ] Fase 2.3 shell layout (header + bottom nav)

---

## 2026-04-28 — Fase 2.3 quick completata (shell + bottom nav)

**Autore**: Federico + Codex  
**Tempo**: ~40 min  
**Fase corrente**: Fase 2

**Cosa fatto:**
- Creata shell app condivisa con:
  - header (branding PM, email utente, logout)
  - area contenuto scrollabile
  - bottom nav a 5 tab: `Home`, `Ordine`, `Storico`, `Guida`, `Admin`
- Aggiunte route placeholder per completare il routing base fase 2.3:
  - `/ordine`
  - `/storico`
  - `/guida`
- Rifattorizzata gestione sessione con helper:
  - `lib/auth/session.ts` (`requireUserSession`, `getUserRole`)
- Adeguato stile globale al frame v2 (sfondo esterno grigio + nav height)

**Cosa resta (next):**
- [ ] Merge branch `migration/nextjs-v3` -> `main` (se non ancora fatto)
- [ ] Deploy Vercel su `main` e smoke test cloud della shell
- [ ] Fase 2.4 palette/theming raffinata + 2.5 componenti base (`Button`, `Card`, `Toast`, `ConfirmDialog`)
- [ ] Fase 2.6 import logo asset PM

**Blockers / decisioni aperte:**
- In questa workspace non disponibili `gh`/GitHub connector con permessi repo: PR/merge da completare via GitHub UI
