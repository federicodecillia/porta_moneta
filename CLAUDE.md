# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Porta Moneta GAS** is a web app for managing a community food cooperative (GAS — Gruppo di Acquisto Solidale). It replaces a shared Google Sheet with a web application for weekly produce orders and member balance tracking.

The entire stack runs on Google's free tooling: Google Apps Script (backend + hosting), Google Sheets (datastore), Google Account login (auth), vanilla HTML/CSS/JS (frontend). There are no npm packages, no build step, and no external services.

## Project Structure

**Active codebase: `app_gas_v2/src/`** — this is what is deployed and live.

`app_gas/` is the previous version (kept for reference). Do NOT edit it.

```
app_gas_v2/
├── .clasp.json          # Clasp config (scriptId, rootDir: src)
└── src/                 # ← THIS is the active codebase
    ├── Main.gs          # API router — callApi() dispatcher
    ├── Config.gs        # Sheet names, column schemas, constants
    ├── Storage.gs       # Sheet CRUD + CacheService layer
    ├── Auth.gs          # Session resolution, requireSession_(), requireAdmin_()
    ├── Orders.gs        # Member dashboard, order saving
    ├── Cycles.gs        # Cycle create/close/list
    ├── Products.gs      # Product loading and duplication
    ├── Ledger.gs        # Balance tracking, topups, order charges
    ├── Members.gs       # Member CRUD (adminUpsertMember, adminGetMembers)
    ├── Suppliers.gs     # Supplier CRUD (adminGetSuppliers, adminUpsertSupplier)
    ├── Audit.gs         # Append-only audit trail
    ├── Setup.gs         # First-run sheet creation and seed data
    ├── Utils.gs         # Helpers: assert_, generateId_, nowIso_, toNumber_
    ├── Test.gs          # Test & utility functions (runSmokeTest, runEndToEndTest)
    ├── Index.html       # HTML shell with all <?!= include(...) ?> directives
    ├── Styles.html      # All CSS — orange/teal design system, mobile-first
    ├── AppCore.html     # PM namespace, API wrapper, router, toast, confirm dialog, logo base64
    ├── AppMember.html   # Promise.finally polyfill (browser compat)
    ├── AppAdmin.html    # Admin orchestrator — 5-tab shell (Ciclo/Prodotti/Ordini/Cassa/Soci)
    ├── ComponentMemberHome.html    # Member dashboard: saldo hero, cycle countdown, order summary
    ├── ComponentOrderForm.html     # Order form: product list with pill steppers, sticky footer
    ├── ComponentStorico.html       # Storico: order history tab + ledger movements tab
    ├── ComponentGuide.html         # User guide: how-to steps + FAQ accordion
    ├── ComponentAdminCycle.html    # Cycle management: open/close, stats
    ├── ComponentAdminProducts.html # Product loading via text (semicolon-delimited) or duplication
    ├── ComponentAdminOrders.html   # Order summary: per-product table + per-member expandable
    ├── ComponentAdminLedger.html   # Topup recording + member balance table + inline entry edit
    ├── ComponentAdminMembers.html  # Member management: add, role change, activate/deactivate
    └── appsscript.json             # Apps Script manifest
```

## Development Commands

All clasp commands must be run from `app_gas_v2/` directory:

```bash
cd app_gas_v2
clasp login                # Authenticate (token expires often — run this first if push fails)
clasp push --force         # Push src/ to Apps Script
clasp deploy -i <ID> -d "description"  # Update deployment
clasp deployments          # List deployments
```

Current deployment ID: `AKfycbzaYomy3jUuu3GXVlRHR88TZKh1LK2BZkNzVKyCUm1KqV71I_vEIVNAgyozJbD2b4onhA`

Quick push + deploy:
```bash
cd /Users/decilliaf/ai_projects/porta_moneta/app_gas_v2 && clasp push --force && clasp deploy -i AKfycbzaYomy3jUuu3GXVlRHR88TZKh1LK2BZkNzVKyCUm1KqV71I_vEIVNAgyozJbD2b4onhA -d "description"
```

**Note**: `clasp open` is NOT supported in this clasp version. Use direct URL:
```
https://script.google.com/home/projects/1Z_0LkvuRHTIb4FfpjWOtZiOL24Rr124COmEeiC2DG9KfqO2xxFd3rYBs/edit
```

Live app URL: **gas.portamoneta.org** (Squarespace forwarding → Apps Script exec URL)

**Test & utility functions** (run in Apps Script editor — select function, click Run):
```javascript
runSmokeTest()       // Verifica infrastruttura: spreadsheet, sheets, soci, saldo
runEndToEndTest()    // Full cycle con Test User (test@portamoneta.org): topup → ciclo → ordine → chiusura → verifica saldo. Richiede nessun ciclo aperto.
```

### Current Members

| Name | Email | Role |
|------|-------|------|
| Manuel Rizzo | manuel.rizzo@portamoneta.org | admin |
| Nadia Di Simine | nadia.disimine@portamoneta.org | admin |
| Maria Malacrino | maria.malacrino@portamoneta.org | admin |
| Maria Fois | maria.fois@portamoneta.org | member (attivo) |

## Architecture

### Request Flow

```
Frontend (ComponentXxx.html) → PM.api(action, payload)
  → google.script.run.callApi(action, payload)
    → Main.gs::callApi() dispatcher
      → requireSession_() or requireAdmin_() auth check
      → Handler function
        → Storage.gs (CacheService → Google Sheets)
```

### Storage Layer

Storage.gs implements a **CacheService layer over Google Sheets**:
- First read → loads from Sheets (~1-2s), caches for 5 minutes
- Subsequent reads → served from CacheService (~50ms)
- Every write → invalidates the relevant cache key
- Data always persists in Sheets; cache is a transparent accelerator
- 100KB per key limit (well within our data size)

### Frontend Architecture

The frontend is a **single-page app with hash-based routing**:
- `PM` namespace in `AppCore.html` — API wrapper, router, toast, confirm dialog, logo base64
- **5 views**: `#home`, `#ordine`, `#storico`, `#guida`, `#admin`
- Components load data on view change via `PM._onViewChange()`
- All components show an error state with retry button on failure (never just a toast)
- Max-width **480px centered** on desktop; `html` background `#ddd8d0` frames the app

### Admin Panel

5 tabs, each rendered by a dedicated component:

| Tab | Component | Container ID |
|-----|-----------|--------------|
| Ciclo | ComponentAdminCycle | admin-ciclo-panel |
| Prodotti | ComponentAdminProducts | admin-prodotti-panel |
| Ordini | ComponentAdminOrders | admin-ordini-panel |
| Cassa | ComponentAdminLedger | admin-cassa-panel |
| Soci | ComponentAdminMembers | admin-soci-panel |

### Design System — Orange/Teal v2

CSS variables in `Styles.html`:

```css
--orange:    #F5A623   /* primary brand, buttons, active nav */
--orange-l:  #FEF3DC   /* saldo positive background */
--teal:      #00A896   /* cycle open badge, topup, teal buttons */
--teal-l:    #E0F5F3   /* teal light backgrounds */
--gray:      #58595B
--gray-l:    #ADADAD
--near-blk:  #2d2b29   /* primary text */
--warm-wh:   #faf8f5   /* app background */
--red:       #E05252   /* negative balance, errors */
--red-l:     #FEECEC
--border:    rgba(88,89,91,0.10)
--sans:      'Inter', system-ui, sans-serif
--mono:      'Geist Mono', ui-monospace, monospace
--nav-h:     82px
```

Key design patterns:
- **Logo**: orange/teal PNG embedded as base64 in `PM.LOGO_SRC` (AppCore.html)
- **Saldo hero card**: orange-light (positive) or red-light (negative), 70px amount, stats row
- **Cycle card**: countdown chips (days/hours/min), teal progress bar, `badge-teal badge-dot`
- **Pill steppers**: zero-state (single + btn) vs has-qty state (minus + qty + orange + btn)
- **Sticky footer** in order form: shows total + projected balance, only visible when qty > 0
- **Segmented tabs**: rounded pill container with active/inactive states (Storico, admin Orders)
- **Bottom nav**: SVG outline/filled pair per tab, orange accent for active
- **Skeleton shimmer**: `skeleton-card` + `skeleton` classes while loading
- **Admin panels**: `view-flex` container → fixed header → scrollable `admin-panel.active` (flex:1)
- **Animations**: `prefers-reduced-motion` disables all transitions/animations

### Role System

Members have one of three roles:
- `admin` — full access including admin panel
- `attivo` (alias: `member`) — can order; shown in "Attivi" group in admin
- `socio` — can only view; shown in "Soci" group in admin

Cycle `access_level` controls who can order: `'attivi'` (default) or `'all'`.

### Data Model (Google Sheets as tables)

Six sheets in one Spreadsheet — no formulas, all values computed server-side:

- **members** — User registry; `role`: `admin`, `attivo`/`member`, `socio`
- **order_cycles** — Weekly order windows; `supplier_id` FK; only one `open` at a time
- **products** — Per-cycle product list; loaded from semicolon-delimited text or duplicated
- **orders** — Line items per member per cycle
- **ledger_entries** — Double-entry balance: `topup` (+), `order_charge` (−), `adjustment`
- **audit_log** — Append-only admin action log
- **suppliers** — Supplier registry; referenced by `order_cycles.supplier_id`

ID prefix convention: `cyc_*`, `mem_*`, `prd_*`, `ord_*`, `led_*`, `aud_*`, `sup_*`.

### Security Model

- All auth enforcement is server-side only. Frontend role-switching is cosmetic.
- `requireSession_()` blocks unauthenticated calls; `requireAdmin_()` blocks non-admins.
- Members can only read their own data (filtered by `member_id`).
- Never trust anything from the frontend payload for access control decisions.

### Key Business Rules

- Closing a cycle auto-generates `order_charge` ledger entries for every member with orders.
- Member balance = `SUM(ledger_entries.amount)` for that member.
- **Negative balance is allowed** — `saveMyOrder` warns (orange toast) but does not block.
- Products loaded via plain text: one line per product, `Name;Variant;Format;Price;Supplier;Notes`.
- Email is the unique identifier for members (login key via Google Session).
- External emails (non `@portamoneta.org`) are supported — admin adds them manually.

### Known Issues / Lessons Learned

- **Date serialization**: Google Sheets returns Date objects from cells. Must be converted to ISO strings in `readSheetObjects_()` before returning via `google.script.run`, otherwise client gets `null`/`undefined` → "Errore sconosciuto".
- **Spreadsheet open caching**: `SpreadsheetApp.openById()` is expensive. `_cachedSpreadsheet` avoids reopening on every read within the same execution.
- **`clasp push` vs deploy**: `clasp push` only updates source code. Must also run `clasp deploy -i <ID>` to update the live web app.
- **Error handling**: All components must show error state with retry button, not just toast (which disappears after 3s leaving spinner forever).
- **clasp token**: The RAPT token expires often. If `clasp push` gives `invalid_grant`, run `clasp login` first.
- **Logo base64**: The Porta Moneta logo (orange/teal paperclips + "Porta Moneta" text) is embedded in `AppCore.html` as `PM.LOGO_SRC`. If replacing, use `base64 -i logo.png | tr -d '\n'` and update via Python regex (the string is too long for a manual Edit).

## Docs

- `DESIGN.md` — Design system spec for v2 (orange/teal palette, component patterns).
- `app_gas/` — Previous version, kept for reference. Do not deploy from here.
