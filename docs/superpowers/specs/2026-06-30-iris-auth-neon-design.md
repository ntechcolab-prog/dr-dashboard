# Batch Book — Slice 1: IRIS Cloud auth + per-company Neon state

**Date:** 2026-06-30
**Status:** Approved (brainstorm), implementing
**Scope:** Slice 1 of 5. Following slices (queued, not in this spec): 2) data coherence, 3) plausible numbers, 4) live operation, 5) visual polish.

## Goal

Turn Batch Book (today a static Vite SPA) into an app gated by a recreated **IRIS Cloud** login, with real accounts in **Neon**, where users belong to a **company** and all editable state is shared across that company. This is needed so we can put real clients into testing and because leadership wants login.

## Decisions (from brainstorm)

- **Architecture:** migrate Vite → **Next.js** (App Router). Chosen over keeping Vite+functions because the product will link real external APIs (IRIS, ThingsBoard) later — Next gives server-side secret handling, middleware auth gating, and matches the rest of the stack (Nerida/VOA). Components migrate ~1:1 as client components.
- **Auth model:** open signup (anyone can register). Fields: **name, company, email, password** (min 8). Password hashed with **scrypt** (`node:crypto`). Session = signed **JWT** in an httpOnly/secure/sameSite cookie (`jose`), 7-day expiry.
- **Login UI = recreation of the IRIS Cloud login screen** (visual only, disconnected from the real IRIS — auth is our Neon backend). Steel-blue accent (~#6ca8c9), not the IRIS HMI teal. Includes a faux Cloudflare Turnstile "Success!" widget and "Forgot your password?" (non-functional placeholder this slice). A discreet **Sign up** link is added (the real IRIS screen has none, but we need open signup reachable).
- **Post-login = recreation of the IRIS Cloud launcher** ("Hi, {firstName}" / "Choose an application to start") with one card, **PRODUCTION MONITORING**, whose arrow button enters Batch Book. Top bar mirrors IRIS Cloud (app-grid icon, IRIS Cloud logo, "Hello, {initials}" avatar, hamburger).
- **Tenancy:** unit = **company**. Multiple users of the same company share one workspace. At signup, match by normalized company name — exists → join; else → create. (Caveat: two distinct companies with the same name would merge; acceptable for controlled testing. Upgrade to invite-codes later if needed.)
- **Per-company shared state (option B):** ALL editable surfaces become shared per company, persisted in Neon — Settings, Saved Analyses, Registry edits, availability config, branding, metric styles, holidays. Implemented via a generic per-company key→JSON store, not bespoke tables.
- **Admin:** designated by `ADMIN_EMAILS` env (comma-separated). `/admin` lists registered users with company, email, created, last login.
- **Out of scope this slice:** email verification, password reset (no email infra), per-company *distinct* read-only dashboards (folded into Slice 2 where the data layer is rebuilt with a seed). Read-only dashboards stay shared demo data for now.

## Architecture

### Routes
- `app/login` — IRIS Cloud login (public)
- `app/signup` — signup, same visual language + name/company (public)
- `app/(app)/page.tsx` — IRIS launcher / home (protected; landing after login)
- `app/(app)/batch-book/page.tsx` — the existing dashboard mounted as `<AppShell/>` (protected)
- `app/admin/page.tsx` — admin user list (protected, admin only)
- `app/api/auth/{signup,login,logout,me}/route.ts`
- `app/api/state/[key]/route.ts` — GET/PUT per-company KV
- `middleware.ts` — redirects unauthenticated requests under `(app)`/`/admin` to `/login`

### Data model (Neon + Drizzle)
- `companies`: id (uuid), name (text), normalized_name (text, unique), created_at
- `users`: id (uuid), company_id (fk), name, email (unique, citext/lowercased), password_hash, is_admin (bool), created_at, last_login_at
- `company_state`: company_id (fk), key (text), value (jsonb), updated_at — **primary key (company_id, key)**

### The "make B cheap" trick
Today all editable state already lives in ~16 localStorage keys (a key→JSON store): branding (`dr-name-current`, `dr-app-icon`), settings (`dr-settings-general/oee/notifs/export`), `dr-analyses`, `dr-registry-rows` + `dr-batch-seq`, `dr-metric-styles`, `dr-holidays-custom`, availability (`dr-availability-*`, plan/confirm/working-holidays/prefs). We mirror that shape in `company_state` and swap `useLocalStorage(key, default)` → `useCompanyState(key, default)` (identical signature) backed by `/api/state/[key]` scoped to the logged-in user's company. Last-write-wins per key. No screen rewrites.

### Hydration
A `CompanyStateProvider` (client) fetches the company's full state map once on entry into `(app)`, seeds a context cache, and `useCompanyState` reads from it synchronously (no loading flash) and writes through to the API + cache. Falls back to the existing defaults when a key is absent.

## Auth flow
1. `/signup` → POST `/api/auth/signup` → validate, resolve/create company, scrypt-hash, insert user, set session cookie → redirect `/`.
2. `/login` → POST `/api/auth/login` → verify scrypt, update last_login_at, set cookie → redirect `/`.
3. `(app)` pages read session in middleware; `/api/auth/me` returns `{ user, company }` for the shell (name, initials, admin flag).
4. Logout clears the cookie.

## Security notes
- Passwords: scrypt with per-user random salt, constant-time compare.
- Session secret from `SESSION_SECRET` env; cookie httpOnly + secure + sameSite=lax.
- `/api/state/*` authorizes by the company_id in the session — a user can never read/write another company's keys.
- Admin routes/me gate on `is_admin`.

## Deploy
Techco.lab Vercel (ntechcolab-prog), project `dr-dashboard`, via CLI. New envs: `DATABASE_URL` (Neon, provisioned directly at neon.tech to avoid the Hobby quota block on the Techco.lab Vercel account), `SESSION_SECRET`, `ADMIN_EMAILS`. Git author stays ntechcolab-prog (pre-push hook enforces).

## Risks / caveats
- Company-name collision merges tenants (accepted).
- KV last-write-wins can drop a concurrent edit between two same-company users (accepted for prototype).
- `dr-app-icon` stores a base64 image — large-ish JSONB value; fine but watch payload size.
- Next migration touches build/deploy config; verify `next build` and the live deploy before calling done.
