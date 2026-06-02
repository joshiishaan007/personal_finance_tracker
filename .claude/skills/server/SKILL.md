---
name: server
description: >-
  Personal Finance Tracker backend (Next.js Route Handlers + Mongoose/MongoDB). Load when editing
  anything in src/server/** or src/app/api/** — controllers, services,
  repositories, models, http helpers, migrations, config — or adding an API
  endpoint, auth/JWT logic, CSV import, AI insight, or export.
---

# server — Personal Finance Tracker API (`src/server/` + `src/app/api/`)

The backend of the single Next.js app. Route Handlers in `src/app/api/**/route.ts`
are thin bindings; all logic lives in the 4-layer feature folders under `src/server/`.

## Stack
Next.js 14 Route Handlers (Node runtime) · Mongoose 8 (MongoDB) · zod (via `@/shared`) · jsonwebtoken (JWT in httpOnly cookie) · custom Google OAuth (no passport) · pino logger · `csv-parse` (CSV import via `req.formData()`) · `@google/generative-ai` (Gemini, AI insights). Tests: vitest.

## Layout
- `src/app/api/<feature>/route.ts` (+ `[id]/route.ts`, nested paths) — thin handlers: `export const runtime='nodejs'; export const dynamic='force-dynamic'; export const GET = catchRoute(c.method)`.
- `src/server/http/` — the HTTP helpers (see below). `index.ts` re-exports them.
- `src/server/<feature>/` — `<f>.controller.ts` / `<f>.service.ts` / `<f>.repository.ts` per feature (transaction, budget, goal, category, recurring, netWorth, analytics, pl, reports, notification, ai, export, auth, user).
- `src/server/models/*.model.ts` — Mongoose schemas (10: user, transaction, category, budget, goal, recurringRule, netWorthSnapshot, notification, aiInsight, auditLog).
- `src/server/db.ts` — `connectDB()`, the serverless-cached Mongoose connection (db name `personal-finance-tracker`).
- `src/server/env.ts` — `getEnv()` (validated env). `src/server/logger.ts` — pino.
- `src/server/migrations/` — ordinal migrations + `runner.ts` (`pnpm migrate`).

## HTTP helpers (`src/server/http/`)
- `catchRoute(handler)` — the ONE catch. Calls `connectDB()`, runs the handler, maps thrown errors → `{ success:false, error }` (HttpError→status, Mongoose `CastError`→404, zod/ValidationError→400, else 500 + pino log). Wrap EVERY route method.
- `requireAuth()` — reads the `token` cookie, verifies the JWT, returns `{ userId }` or throws `HttpError(401)`. The framework boundary; its JWT try/catch is the sole sanctioned catch.
- `validateBody(Schema, body)` / `validateQuery(Schema, req)` — zod parse → throw `HttpError(400)` on failure → return parsed value. `validateQuery` folds repeated query keys into arrays.
- `ok(data)` / `created(data)` / `fail(reason)` — the envelope. `fail` maps a `Reason` → status (404/409/403/401/400/429).
- `Ok(data)` / `Err(reason)` + `Result`/`Reason` — discriminated result for expected failures.
- `HttpError(status, msg)` — thrown only at the framework boundary.

## API routes (`src/app/api/`)
`auth` (google, google/callback, logout, me) · `transactions` (+import preview/commit/batch) · `categories` · `budgets` · `goals` · `recurring` · `analytics` · `net-worth` · `pl` · `reports` · `ai` · `export` · `notifications` · `user`.

## Conventions
- **Response envelope:** `{ success: true, data }` / `{ success: false, error }`. Always — via `ok`/`created`/`fail`.
- **Auth:** every protected controller method calls `requireAuth()` first and scopes by the returned `userId`.
- **Validation:** `validateBody`/`validateQuery` in the controller before the service call.
- **Tenant scope:** every query is `{ userId, ... }`. Never accept a userId from the client.
- **Layering:** the controller calls ONE service fn; the service orchestrates repositories; the repository is the only place `Model.*` runs. Build new features this way — `transaction` is the reference.

## Sharp edges (verified)
- **`runtime = 'nodejs'`** on every route handler — Mongoose/jsonwebtoken need Node, not Edge.
- **`dynamic = 'force-dynamic'`** on every route handler — all routes are per-request (DB + auth cookie). Without it Next tries to prerender non-cookie GETs at build and `catchRoute`'s `connectDB()` hits the DB during `next build`.
- **AI route** (`src/app/api/ai/insights/route.ts`) sets `export const maxDuration = 30` — Gemini is buffered (~10s); give it headroom.
- **Cached Mongoose connection** (`src/server/db.ts`) on `globalThis` — serverless-safe, one connection reused across invocations. `catchRoute` already awaits `connectDB()`; don't connect again per handler.
- **CSV import:** parsed from `req.formData()` (the `file` Blob + mapping fields), 10 MB cap, `csv-parse/sync`. Amounts may be major or minor units (`amountIsMinorUnits` flag → ×100 or round); dedup is a `sha256(date|amount|note)` `hash` per user; `/import/commit` checks `seenHashes` in-batch AND an existing-doc lookup. Preserve both.
- **Auth is manual** (no passport): `/api/auth/google` redirects to Google; `/api/auth/google/callback` exchanges the `code`, fetches the profile, `findOrCreateUser`, signs the JWT, and sets the httpOnly cookie. Same-origin — no CORS, no cross-origin cookie hacks.
- **No raw `try/catch` in feature code** — `catchRoute` is the only catch (plus `requireAuth` and `runner.ts`).

## Quality gates
```
pnpm typecheck && pnpm lint && pnpm build && pnpm test
```
Migrations: `pnpm migrate`.
