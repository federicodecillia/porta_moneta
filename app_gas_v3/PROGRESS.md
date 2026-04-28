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
