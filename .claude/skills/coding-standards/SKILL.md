---
name: coding-standards
description: >-
  Universal coding rules for Personal Finance Tracker (single Next.js 14 app). Load for ANY code
  change under src/server/**, the App Router client (src/app, src/components,
  src/hooks, src/lib), or src/shared/**, and whenever scaffolding a feature, route
  handler, hook, component, model, or migration. Restates CLAUDE.md §1–§4 in
  actionable form with the reference feature to copy.
---

# Personal Finance Tracker coding standards

Restatement of `CLAUDE.md` §1–§4. When in doubt, **copy the `transaction` feature
shape** — it's the most complete vertical slice (shared schema → Mongoose model →
route handler → controller → service → repository → client hook → widget → page).

Stack: ONE **Next.js 14 App Router** app. **Route Handlers + Mongoose/MongoDB**
(server, `src/server/`), **React 18 + TanStack Query + axios + Tailwind** (client,
`src/`), **zod** schemas in `src/shared/` imported as `@/shared`. Alias `@/* → src/*`.

---

## BACKEND (`src/server/**` + `src/app/api/**/route.ts`)

**Four layers, never collapsed** — this is the real, existing shape:

| Layer | File | Does | Never |
|---|---|---|---|
| Schema/Model | `src/shared/schemas/<f>.schema.ts` (`@/shared`) + `src/server/models/<f>.model.ts` | zod shapes + Mongoose doc | logic |
| Repository | `src/server/<f>/<f>.repository.ts` | ONE Mongoose query per fn — the only place `<F>Model.*` runs | business logic, `req`/`res` |
| Service | `src/server/<f>/<f>.service.ts` | business logic, returns value or `Result` | touch `req`/`res`/cookies, run queries inline |
| Controller | `src/server/<f>/<f>.controller.ts` | `requireAuth()` + `validateBody`/`validateQuery` + ONE service call + `ok`/`created`/`fail` | DB queries, business logic |
| Route Handler | `src/app/api/<f>/route.ts` | `export const runtime='nodejs'; export const GET = catchRoute(c.list)` | anything else |

**HTTP helpers (`src/server/http/`)** — import these, don't reinvent:
- `catchRoute(handler)` — the ONE catch. Ensures `connectDB()`, runs the handler, maps thrown errors → `{ success:false, error }` (HttpError→status, CastError→404, zod→400, else 500). Wrap every route method.
- `requireAuth()` — reads the JWT `token` cookie, returns `{ userId }` or throws `HttpError(401)`. The framework boundary (its JWT try/catch is the one sanctioned catch).
- `validateBody(Schema, await req.json())` / `validateQuery(Schema, req)` — zod parse, throw `HttpError(400)` on failure, return the parsed value.
- `ok(data)` / `created(data)` / `fail(reason)` — the `{ success, data }` / `{ success:false, error }` envelope. `fail` maps a `Reason` to its status.
- `Ok(data)` / `Err(reason)` + `Result`/`Reason` types — the discriminated result for expected failures.
- `HttpError(status, msg)` — thrown only at the framework boundary.

**Hard rules**
- **No raw `try/catch`** in feature code. The one catch is `catchRoute`. (`requireAuth` and the migration `runner.ts` are the only exceptions.)
- Validate every external input with **zod** in the controller BEFORE calling the service.
- **Tenant scope is `userId` from `requireAuth()`, never the client.** Every Mongoose query is `{ userId, ... }`. A query missing `userId` is a security bug.
- Expected failures (not-found, duplicate, quota) → service returns `Err(reason)`; controller does `r.state === 'ok' ? ok(r.data) : fail(r.reason)`. Don't throw for expected failures.
- A repository fn is ONE query/transaction. Multi-doc atomicity → a Mongoose session, not a TS try/catch.
- Don't read `process.env` deep in pure logic — take primitives, or `getEnv()` at the edge.
- Node-only routes declare `export const runtime = 'nodejs'`; the AI route also sets `export const maxDuration = 30`.

**Reference:** `src/server/transaction/{transaction.controller,transaction.service,transaction.repository}.ts` + `src/app/api/transactions/route.ts`.

---

## FRONTEND (`src/app`, `src/components`, `src/hooks`, `src/lib`)

**Data flow — never skip a layer:**
```
page (src/app) → widget → hooks/use<Feature> (TanStack Query) → api (axios) + ENDPOINTS
  → /api/<feature> (Route Handler) → controller → service → repository → model
```

**Hard rules**
- Data access ONLY in `src/hooks/use<Feature>.ts`. No `services/` god-layer. Reference: `useTransactions.ts`.
- Reads → `useQuery`; writes → `useMutation` + `invalidateQueries` (invalidate the feature key + dependents like `['analytics']`).
- Hooks call the shared `api` (`src/lib/api.ts`) with a path from the **ENDPOINTS registry** (`src/lib/endpoints.ts`) — inline `/api/...` strings are a bug. Never raw `fetch`.
- **Client/server boundary:** UI never imports `src/server/**` or Mongoose. Client widgets/hooks/contexts mark `'use client'`. Pages are server components rendering one widget. Import shared types/schemas from `@/shared` (`import type` where only the type is needed).
- **Component tiers:** element (`src/components/ui/`, wraps one tag, forwards `className`+`ref`) → component (`src/components/`, 2–5 elements, props only, no fetch) → widget (`src/components/<feature>/<Feature>View.tsx`, fetches via hook). Pages (`src/app/(app)/<route>/page.tsx`) compose only.
- **Banned raw tags** in feature JSX (`<button> <input>/<textarea>/<select> <h1-6> <p> <span> <a> <img> <label> <ul/ol/li> <table>`) — use the `src/components/ui` wrapper (all exist: Button, Input, Textarea, Select, Heading, Text, Link, Image, Label, List, Table, ...). Allowed raw: `<div> <section> <main> <aside> <form>`.
- **Sort/paginate/filter server-side ONLY** — pass params through the chain to MongoDB; never `.filter().sort().slice()` fetched data.
- **Tailwind only.** Token classes (`brand/success/warn/danger/slate`, `--chart-*`), compose with `cn`. No CSS Modules/SCSS/CSS-in-JS/inline-style, no raw hex in feature code. See the `design-system` skill.
- `memo`/`useMemo`/`useCallback` only with a one-line `//` reason.

---

## CROSS-CUTTING

- **Types:** `strict: true`, no `any` (`unknown` + parse). Shared schemas/DTOs in `src/shared` (`@/shared`); `export type Foo = z.infer<typeof FooSchema>`. Schema/type files are leaves.
- **Comments:** default none; one line only when the *why* is non-obvious. No task/PR refs, no AI attribution.
- **Security:** never log secrets (`pino` redaction); tenant-scope every query; httpOnly (+secure prod) same-origin JWT cookie; Gemini key server-side only (`GEMINI_API_KEY`); OAuth callback verifies the `code` before issuing the cookie.
- **Tests:** vitest (server route/service/repo, client + testing-library). A change to a tested surface without a test is incomplete.
- **Gates:** `pnpm typecheck && pnpm lint && pnpm build`, then `pnpm test` if a tested surface changed. One app — no per-surface filters.

## Workflow
Read the reference feature first → ask one question if ambiguous → short plan for >1 file or >~30 lines → cover edge cases (empty, large CSV, dup-hash, 401 vs 404, offline replay, stale cache) → user can override a named rule for a named scope.
