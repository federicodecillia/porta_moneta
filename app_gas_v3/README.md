# Porta Moneta GAS — v3 (in sviluppo)

Stack: **Next.js 15** + **Postgres (Neon)** + **Vercel** + **Auth.js** + **Drizzle ORM**.

> 🚧 Questa cartella ospita la riscrittura v3 di Porta Moneta.
> v2 (Apps Script + Sheets) resta in produzione su `gas.portamoneta.org` e in `../app_gas_v2/`.

## Quick Start (riprendere il lavoro)

1. **Leggi `PLAN.md`** — piano operativo completo a 6 fasi
2. **Leggi `PROGRESS.md`** — cosa è stato fatto finora e qual è il prossimo task
3. **Branch corretto**: `git checkout migration/nextjs-v3`
4. Aggiorna `PROGRESS.md` a fine sessione

## Struttura attesa (a regime)

```
app_gas_v3/
├── PLAN.md                  # piano migrazione (questo fase 0 → 6)
├── PROGRESS.md              # changelog vivente
├── README.md                # questo file
├── package.json
├── next.config.ts
├── drizzle.config.ts
├── tailwind.config.ts (o config in CSS per v4)
├── auth.ts                  # Auth.js config
├── middleware.ts            # protezione route
├── .env.example
├── app/                     # App Router
│   ├── (auth)/login/
│   ├── (member)/            # gruppo route socio
│   │   ├── page.tsx         # home
│   │   ├── ordine/
│   │   ├── storico/
│   │   └── guida/
│   └── (admin)/admin/
│       ├── ciclo/
│       ├── prodotti/
│       ├── ordini/
│       ├── cassa/
│       └── soci/
├── components/              # UI primitives + composite
├── lib/
│   ├── db/                  # Drizzle schema + queries
│   ├── auth/                # helpers requireAdmin etc.
│   └── utils/
├── scripts/
│   └── migrate-from-v2.ts   # one-shot import da Apps Script
└── public/                  # icons, manifest
```

## Comandi (dopo scaffold)

```bash
cd app_gas_v3
pnpm install
pnpm dev               # http://localhost:3000
pnpm db:push           # apply schema su Neon
pnpm db:studio         # Drizzle Studio
pnpm migrate:v2        # one-shot import dati da v2
pnpm build && pnpm start
```

## Convenzioni

- **TypeScript strict** ovunque
- **Server Components default**, Client Components solo dove serve interattività
- **Server Actions** per ogni mutation (no API route per CRUD interno)
- **Drizzle queries** in `lib/db/` (non sparse nei components)
- **Auth check server-side**: ogni Server Action wrappata in `requireSession()` o `requireAdmin()`
- **Commit prefix**: `[v3] feat:`, `[v3] fix:`, `[v3] chore:`

## Tracker decisioni

Vedi sezione "Open Questions" in `PLAN.md`.
