# Public repo + live demo — design

**Date:** 2026-06-10
**Status:** approved by Federico (brainstorming session)

## Goal

Turn the already-public repo into an effective showcase: a clickable live demo,
a real OSS license, and a consulting CTA. Success = LinkedIn visibility,
GitHub stars/forks, inbound requests from other GAS/co-ops.

## Decisions

1. **Single repo.** No separate "showcase" repo. The story is "real production
   app for a real Italian food co-op" and the current repo IS that story.
   Keep the name `federicodecillia/porta_moneta`.
2. **License: MIT** (`LICENSE` file at repo root). Brand assets stay excluded:
   `logo.png`, `icon.png` and the `portamoneta.org` domain belong to APS Porta
   Moneta — keep the existing README note, reworded to match MIT.
3. **Live demo deployment** (see below) + **video/GIF walkthrough** for README
   and LinkedIn.
4. **Out of scope for now:** brand genericization (config-driven theming),
   one-click fork template, repo rename. Revisit only on real signals
   (issues, fork requests, client inquiries).

## Demo mode

Env flag `DEMO_MODE=true`, set ONLY on the demo Vercel project.

- **Auth:** when the flag is on, register an Auth.js Credentials provider and
  show two buttons on the login page: "Entra come Socio" and "Entra come
  Admin". They sign in as two seeded demo members without Google OAuth.
  When the flag is off (prod), the provider is not registered at all — the
  code path does not exist.
- **Banner:** persistent banner in the app shell: demo environment, data
  resets nightly.
- **External side effects disabled in demo:** no Resend emails, no Google
  Drive backup. Guard at the call sites (`DEMO_MODE` check), fail silent +
  log.

## Demo data + reset

- Seed script `npm run db:seed:demo` (idempotent: truncate + insert):
  plausible fake Italian members (incl. the two demo login users, one admin),
  suppliers, products with categories, one open cycle, 2 closed cycles with
  orders, ledger movements, notifications. Enough history that the admin
  analytics dashboard looks lived-in.
- Nightly reset: GitHub Actions cron (same pattern as the existing weekly
  backup workflow) runs the seed script against the demo database using a
  `DEMO_DATABASE_URL` repo secret.

## Demo infrastructure

- Second Vercel project, same repo, root `app_gas/`, demo env vars
  (`DEMO_MODE=true`, demo Neon URL, `AUTH_SECRET`). Default
  `*.vercel.app` URL is fine (e.g. `porta-moneta-demo.vercel.app`).
- Separate Neon project (free tier) for demo data — NOT a branch of the prod
  project, so a connection-string mixup can never touch prod.
- Prod project untouched: no `DEMO_MODE` var set there.

## README + marketing surface

- "Live Demo" badge/link at the top of the README.
- Short GIF (10–20s) embedded in the README; 60–90s video kept for the
  LinkedIn post (native upload).
- GitHub repo metadata: description with demo URL, topics
  (`nextjs`, `react`, `typescript`, `drizzle-orm`, `postgres`, `gas`,
  `food-coop`, `cooperative`), social preview image.
- New final README section: "Want this for your GAS / association?" —
  consulting CTA with contact links (the client funnel).

## Error handling / safety

- Demo admin can mutate everything; nightly reset is the recovery story.
- Seed script refuses to run if the target database URL matches the prod URL
  pattern (guard against wiping prod).
- `DEMO_MODE` must never be set on the prod Vercel project; document this in
  SETUP.md.

## Testing

- Unit-level: seed script runs twice in a row without errors (idempotence).
- Manual: demo login (both roles) works on the demo deployment; Google OAuth
  still the only path on prod; no emails sent from demo flows.

## Non-technical note

Federico is the volunteer IT manager of APS Porta Moneta. The repo is already
public and the README already credits/excludes the association's brand, but an
informal OK from the consiglio about using the association's name as a
showcase is prudent (likely already settled).
