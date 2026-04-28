# Piano Operativo — Migrazione GAS v2 → v3

> **Stato**: 📋 pianificato, non iniziato — 2026-04-28
> **Branch**: `migration/nextjs-v3`
> **Obiettivo**: Riscrivere Porta Moneta GAS su stack moderno (Next.js + Postgres + Vercel) mantenendo v2 live in parallelo finché v3 non è validata.

---

## 0. Obiettivo & Criteri di Successo

**Cosa vogliamo ottenere:**
- Tempi di risposta **< 200ms** (oggi 2-4s)
- App **installabile come PWA** sul telefono dei soci
- Stesso UX e design v2 (orange/teal, 5 sezioni SPA)
- **Zero regressioni funzionali** rispetto a v2
- Deploy automatici con **preview URL per ogni branch**

**Done quando:**
- [ ] Tutti i flussi v2 funzionano in v3 (membro: home/ordine/storico/guida; admin: 5 tab)
- [ ] Dati storici (ledger, ordini, cicli) migrati senza perdite
- [ ] Login Google funzionante con whitelist `members` table
- [ ] Lighthouse score ≥ 90 su mobile
- [ ] DNS `gas.portamoneta.org` punta a v3
- [ ] v2 disattivata o ridotta a backup read-only

**Non in scope (per ora):**
- Notifiche email/push
- Multi-tenancy (più GAS sulla stessa app)
- Pagamenti integrati
- Dashboard analitiche

---

## 1. Decisioni Architetturali

| Area | Scelta | Rationale |
|---|---|---|
| **Framework** | Next.js 15 App Router | Server Components → meno JS al client, meno round-trip; ecosistema stabile |
| **Linguaggio** | TypeScript strict | Type safety = meno bug, migliora refactoring |
| **DB** | Neon Postgres (free tier) | Serverless, autoscaling, branching gratuito per testing |
| **ORM** | Drizzle ORM | Lightweight, type-safe, ottimo per serverless (no connection pooling pain) |
| **Auth** | Auth.js v5 (NextAuth) + Google provider | Gratis, mainstream, integra bene con Next.js App Router |
| **UI primitives** | shadcn/ui + Radix | Accessibili, customizzabili, copia-incolla nel codebase |
| **Styling** | Tailwind CSS v4 | Config CSS-based, palette orange/teal mappata da `DESIGN.md` |
| **Hosting** | Vercel Hobby | €0/mese, preview URL automatici, edge network globale |
| **Mutations** | Server Actions | Niente API routes esplicite per CRUD interno |
| **Data fetching** | Server Components + cache | RSC + `revalidatePath` invece di CacheService |
| **PWA** | Manifest + icons (no service worker custom inizialmente) | Installabile, sufficiente per scope |
| **Email transazionali** | Nessuna (per ora) | Non necessarie nello scope v2 |

**Versioni target a scaffold time** (verificare al momento):
- `next@^15` (NON 16, troppo bleeding edge per cache components)
- `react@^19`
- `next-auth@^5` (beta stabile)
- `drizzle-orm` + `@neondatabase/serverless`
- `tailwindcss@^4`

---

## 2. Strategia di Coesistenza v2 ↔ v3

```
┌─────────────────────────┐         ┌─────────────────────────┐
│  v2 (Apps Script)       │         │  v3 (Next.js + Vercel)  │
│  gas.portamoneta.org    │         │  gas-v3.vercel.app      │
│  Sheets datastore       │         │  Neon Postgres          │
│  PRODUZIONE             │         │  STAGING/dev            │
└─────────────────────────┘         └─────────────────────────┘
        │                                       │
        │                                       │
        └──── snapshot iniziale ───────────────►│
                                                │
                                       (sviluppo, validazione)
                                                │
                                                ▼
                                       ┌──────────────┐
                                       │ Cutover DNS  │
                                       │ Squarespace  │
                                       │ → Vercel     │
                                       └──────────────┘
```

**Regole d'oro durante la migrazione:**
- **v2 resta sorgente di verità** finché non si fa il cutover
- v3 lavora su una **copia snapshot** dei dati v2 (rinfrescata periodicamente in dev)
- Nessuna scrittura da v3 ai sheets di v2
- Test su Test User dedicato, mai sui dati reali di membri attivi
- Se durante lo sviluppo v2 viene aggiornata (commit, deploy), va annotato in `PROGRESS.md` per ri-sincronizzare lo schema

---

## 3. Fasi Operative

> **Stima totale**: 10-13 giorni di lavoro effettivo, ~2-3 settimane di calendario.
> Ogni fase è autonoma e mergeable; commit frequenti.

### 🚀 Fase 0 — Foundation (1 giorno)

**Obiettivo**: Next.js app deployata su Vercel, connessa a Neon, con Auth.js Google funzionante (anche solo "ciao admin").

**Task:**
- [ ] **0.1** Scaffold: `npx create-next-app@latest app_gas_v3 --typescript --tailwind --app --src-dir`
  - Già esiste cartella `app_gas_v3/` — usare flag `--no-src-dir` o creare in temp e mergeare
- [ ] **0.2** Account Vercel + nuovo progetto, link a `app_gas_v3/` (root directory nel monorepo)
- [ ] **0.3** Account Neon, nuovo progetto `porta-moneta-v3`, copia connection string
- [ ] **0.4** Install: `drizzle-orm @neondatabase/serverless drizzle-kit next-auth@beta`
- [ ] **0.5** Setup Auth.js: Google OAuth credentials su Google Cloud Console (scope: profile email), provider config in `auth.ts`
- [ ] **0.6** Pagina `/` protetta che mostra `session.user.email` se loggato
- [ ] **0.7** Variabili env su Vercel: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- [ ] **0.8** Primo deploy in produzione su Vercel; URL preview funzionante

**Done quando**: aprendo `gas-v3.vercel.app` (o equivalente) in incognito, login Google porta alla home con email visibile.

**File chiave creati**: `app/page.tsx`, `auth.ts`, `middleware.ts`, `drizzle.config.ts`, `.env.example`.

---

### 🗄️ Fase 1 — Schema DB & Data Migration (1-2 giorni)

**Obiettivo**: Schema Postgres che rispecchia v2; script di migrazione one-shot da Sheets a Neon; verifica integrità.

**Task:**
- [ ] **1.1** Tradurre schema da `app_gas_v2/src/Config.gs` a Drizzle:
  - `members`, `suppliers`, `order_cycles`, `products`, `orders`, `ledger_entries`, `audit_log`
  - Tipi Postgres: usare `numeric(10,2)` per importi, `timestamptz` per date, `text` per ID
  - Foreign keys esplicite (a v2 erano implicite)
  - Indici: `orders.cycle_id`, `orders.member_id`, `ledger_entries.member_id`
- [ ] **1.2** `drizzle-kit push` → applicare schema su Neon
- [ ] **1.3** Endpoint Apps Script in v2 (read-only) `?action=exportAll` che ritorna JSON di tutti i sheets
  - Implementarlo in `app_gas_v2/src/Main.gs` come admin-only, deploy come web app
- [ ] **1.4** Script Node `app_gas_v3/scripts/migrate-from-v2.ts`:
  - Fetch dell'export
  - Insert in Postgres con conversioni (Date string → timestamptz, parse numeri)
  - Idempotente (truncate + insert, oppure upsert su PK)
- [ ] **1.5** Verifica: confronto count e somme per ogni tabella; sample di 5 righe random per ledger
- [ ] **1.6** Documentare procedura di re-sync in `PROGRESS.md`

**Done quando**: query SQL `SELECT SUM(amount) FROM ledger_entries WHERE member_id = X` ritorna lo stesso saldo di v2 per ogni socio.

---

### 🔐 Fase 2 — Auth & Shell (1 giorno)

**Obiettivo**: Login Google ristretto a soci registrati; layout app con bottom nav e routing.

**Task:**
- [ ] **2.1** Auth.js callback `signIn`: rifiuta login se email non in `members` (o crea pending entry da approvare)
- [ ] **2.2** `middleware.ts`: redirect a `/login` se non autenticato; redirect ad `/admin` solo per role `admin`
- [ ] **2.3** Root layout con: header (logo PM), bottom nav (5 tab: Home/Ordine/Storico/Guida/Admin*)
- [ ] **2.4** Tailwind config con palette da `DESIGN.md` (`--orange`, `--teal`, etc.) come custom properties
- [ ] **2.5** Componenti base: `Button`, `Card`, `Toast`, `ConfirmDialog` (port da AppCore.html)
- [ ] **2.6** Logo PM importato come asset (non più base64)

**Done quando**: navigazione fra tab funziona, design matcha v2 a colpo d'occhio, logout funziona.

---

### 👤 Fase 3 — Viste Membro (2-3 giorni)

**Obiettivo**: Le 4 viste membro (Home, Ordine, Storico, Guida) sono complete e identiche a v2.

**Task:**
- [ ] **3.1** **Home** (`app/(member)/page.tsx`):
  - Server Component fetcha saldo + ciclo aperto + sintesi ordine corrente
  - Saldo hero card (orange-light/red-light)
  - Cycle card con countdown chips e progress bar (Client Component per timer)
- [ ] **3.2** **Ordine** (`app/(member)/ordine/page.tsx`):
  - Server fetch prodotti del ciclo corrente
  - Pill steppers (Client Component con `useOptimistic`)
  - Sticky footer con totale e saldo proiettato
  - Server Action `saveOrder` con validazione (zod) + audit log
- [ ] **3.3** **Storico** (`app/(member)/storico/page.tsx`):
  - Tab segmentato: ordini / movimenti
  - Tabella ordini per ciclo (RSC)
  - Tabella movimenti ledger (RSC)
- [ ] **3.4** **Guida** (`app/(member)/guida/page.tsx`):
  - Contenuti markdown statici (MDX o JSON)
  - Accordion FAQ (Client Component)

**Done quando**: un socio test fa login, fa un ordine, lo modifica, lo cancella, e vede tutto correttamente nel ledger e storico.

---

### 🛠️ Fase 4 — Admin Panel (3-4 giorni)

**Obiettivo**: 5 tab admin funzionanti.

**Task:**
- [ ] **4.1** **Tab Ciclo**: list cicli, open/close (server actions), stats correnti
- [ ] **4.2** **Tab Prodotti**: parser testo semicolon-delimited → insert; duplicazione da ciclo precedente
- [ ] **4.3** **Tab Ordini**: vista per-prodotto e per-membro (con expansion); export CSV
- [ ] **4.4** **Tab Cassa**: registrazione topup, tabella saldi, edit inline ledger entries
- [ ] **4.5** **Tab Soci**: CRUD membri, role change, attivazione, supporto email esterne
- [ ] **4.6** Server Actions wrappate da `requireAdmin()` helper che usa Auth.js session
- [ ] **4.7** Tutti i write loggano in `audit_log`

**Done quando**: admin può gestire un ciclo completo end-to-end senza toccare Apps Script.

---

### ✨ Fase 5 — Polish & PWA (1-2 giorni)

**Task:**
- [ ] **5.1** `manifest.json` + icons 192/512/maskable
- [ ] **5.2** Meta tags iOS Safari per "Aggiungi a schermata Home"
- [ ] **5.3** Loading states (Suspense + skeleton)
- [ ] **5.4** Error boundaries con retry button (analogo v2)
- [ ] **5.5** Toast system (sonner o custom)
- [ ] **5.6** Lighthouse audit → target ≥ 90 mobile (perf, a11y, best practices)
- [ ] **5.7** Test cross-browser: Safari iOS, Chrome Android, desktop
- [ ] **5.8** `prefers-reduced-motion` rispettato

**Done quando**: app installabile come PWA su iOS e Android, Lighthouse > 90, nessun warning console.

---

### 🚦 Fase 6 — Cutover (0.5 giorni)

**Task:**
- [ ] **6.1** Annunciare downtime breve ai soci (es. domenica notte 30 min)
- [ ] **6.2** Mettere v2 in modalità read-only (banner "manutenzione")
- [ ] **6.3** Re-run script di migrazione per snapshot finale
- [ ] **6.4** Verifica integrità dati post-sync
- [ ] **6.5** Squarespace: cambiare forwarding `gas.portamoneta.org` → URL Vercel produzione
- [ ] **6.6** Test live: login con 2-3 account reali, verifica saldo
- [ ] **6.7** Rimuovere banner manutenzione v2; v2 resta accessibile via URL Apps Script per emergenza
- [ ] **6.8** Monitoring 48h: log Vercel, errori utenti

**Done quando**: utenti accedono a v3 senza accorgersi del cambio (a parte la velocità).

**Periodo di grace**: v2 mantenuta runnable per 30 giorni post-cutover come fallback.

---

## 4. Rollback Plan

Se v3 ha un problema critico nelle prime 48h post-cutover:

1. **Squarespace**: revertire forwarding a vecchio URL Apps Script v2
2. **Comunicare**: messaggio Telegram/email "torniamo temporaneamente alla vecchia app"
3. **Diagnosi**: log Vercel + errori utenti → fix
4. **Re-sync**: portare in v3 le scritture fatte su v2 nel frattempo (se ce ne sono)
5. **Re-cutover**: solo dopo fix verificato in staging

Tempo stimato rollback: < 15 minuti.

---

## 5. Open Questions / Decisioni Aperte

- [ ] **Account Vercel**: usare account personale o creare org "porta-moneta"?
- [ ] **Account Neon**: stesso (personale vs org)
- [ ] **Google OAuth credentials**: nuovo progetto GCP dedicato a v3, o riusare quello v2?
- [ ] **Dominio staging**: `gas-v3.vercel.app` (default) o `staging.portamoneta.org`?
- [ ] **Schema DB**: tenere ID stringhe (`mem_*`, `cyc_*`) o passare a UUID? **Raccomando: tenere stringhe** per facilità di audit/debug e compatibilità con eventuali export verso v2.
- [ ] **Audit log**: tenere come tabella o spostare su servizio esterno (es. Axiom, BetterStack)?
- [ ] **Backup DB**: Neon free fa point-in-time recovery 7 giorni; serve backup esterno?
- [ ] **Analytics/error tracking**: Vercel Analytics (free) basta, o serve Sentry?

Tutte queste sono **decisioni rimandabili** — non bloccano l'inizio della Fase 0.

---

## 6. Convenzioni di Lavoro

**Branch**: tutto su `migration/nextjs-v3`. Sub-branch tipo `migration/nextjs-v3/fase-3-ordine` se servono review separate.

**Commit**: prefissi tipo `[v3] feat: ...`, `[v3] chore: ...`. Distingue dai commit di v2 che restano possibili in parallelo.

**Test**: Vitest per unit, Playwright per E2E (almeno smoke test su login + ordine).

**Code review**: prima di mergeare ogni fase, self-review della checklist + lighthouse spot check.

**`PROGRESS.md`**: aggiornare a fine di ogni sessione di lavoro con cosa fatto / cosa resta / blockers.

---

## 7. Riferimenti

- v2 codebase: `app_gas_v2/src/`
- Design system: `DESIGN.md`
- v2 deployment: `https://script.google.com/home/projects/1Z_0LkvuRHTIb4FfpjWOtZiOL24Rr124COmEeiC2DG9KfqO2xxFd3rYBs/edit`
- Sheets datastore (v2): tramite Apps Script `getActiveSpreadsheet()`
