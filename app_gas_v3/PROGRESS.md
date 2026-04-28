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
