# Batch Book ↔ Notify / IRIS integration — notes

Status of wiring the (formerly mock) Batch Book to the real Go backend. All new
code is additive; existing screens still run on mocks until migrated via the
`src/data/dataSource.ts` seam.

## What's in place

- `public/runtime-config.js` → `window.configuration` (two base URLs: customer
  `api` + `manager-api`, Turnstile site key). Runtime, framework-neutral.
- `src/config/runtimeConfig.ts` — reads the config.
- `src/api/*` — typed client (Bearer + 401/403 refresh + per-call base routing),
  auth (login w/ Turnstile, refresh, logout, JWT claims), and domain modules
  against the REAL contracts: `machines`, `batches`/`batch_notes`, `alarms`,
  `filters`, `metrics`, `dataExports`.
- `src/api/adapters.ts` — real → UI shapes. Fields with no backend counterpart
  are 0/'' (never fabricated).
- `src/lib/oee.ts` — OEE = Availability × Performance × Quality computed at
  runtime from real data + business targets (planned time, ideal rate).
- `src/data/dataSource.ts` — single mock↔api switch (default `mock`).
- Tests: `src/lib/oee.test.ts`, `src/api/adapters.test.ts` (vitest).
- `app/iris-login/page.tsx` — real IRIS login with Cloudflare Turnstile
  (`CloudflareCaptcha` from `web-components-ts`, loaded client-only).

## Open items / decisions for the backend team

1. **Base URL: customer `api` vs `manager-api`.** Most endpoints are on `api`;
   confirm which surface the Batch Book targets (config supports both).
2. **`web-components-ts` delivery to CI/Vercel.** The lib is a PRIVATE
   `get-notify` repo. `package.json` points at `github:get-notify/web-components-ts`;
   the Vercel build needs read access (deploy token / GitHub App) or the lib
   must be published to a private registry. Local verification used a packed
   tarball of the prebuilt `dist/`.
   - Note: lib is **MUI 5**, app is **MUI 9** — they coexist in a green build
     (Emotion/React are single/deduped), but keep an eye on styled components.
3. **`batch.target.value` semantics** — is it the recipe target size/mass? If so
   it feeds Performance's ideal rate directly; otherwise a per-recipe target
   config stays client-side.
4. **Unit of `hour_meter` and `property.total_grinding_time`** — assumed hours
   (or HH:MM:SS) and minutes respectively; confirm and adjust `src/lib/oee.ts`.
5. **Metrics chart-data response shapes** — `src/api/metrics.ts` functions are
   generic pending the exact shapes from `api/specification.yaml`.

## Auth gate

`middleware.ts` still gates on the legacy `bb_session` cookie and the old
`/login`. The IRIS flow stores JWTs in localStorage; flipping the gate to a
client-side IRIS guard is a deliberate later step (prod is live on `main`).
