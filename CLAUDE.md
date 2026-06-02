# CLAUDE.md — coding standards (auto-loaded every session)

Loaded automatically into every conversation in this repository. **Every code
change MUST satisfy the rules below.** The only escape is an explicit user
override naming a specific rule for a specific scope. Don't remind the user of
these rules — just follow them. Treat any code you write that violates them as
an incomplete task.

Surface-specific knowledge lives in `.claude/skills/*` (auto-loaded by relevance):
`coding-standards`, `design-system`, `client`, `server`, `shared`, `database`.

> **Stack mode: adapt.** The architecture below (4-layer backend, the data-flow
> direction, element/component/widget tiers, the error model) is fixed. The
> concrete names are this repo's real stack: ONE **Next.js 14 App Router** app at
> the repo root — **Route Handlers + Mongoose/MongoDB** on the server (`src/server/`),
> **React 18 + TanStack Query + axios + Tailwind** on the client (`src/`), **zod**
> schemas in `src/shared/` (imported as `@/shared`). Path alias `@/* → src/*`.
>
> **The 4-layer chain EXISTS — mirror it.** The backend is the full target shape:
> route handler → controller → service → repository → model, with the HTTP helpers
> in `src/server/http/`. There is no inline-route legacy to migrate. When you add
> or change a feature, mirror the most complete reference feature, **`transaction`**
> (`src/server/transaction/*` + `src/app/api/transactions/`).

---

## 0. Response style — terseness is mandatory

Token-constrained environment. **Be terse. No decorations.** Cut sycophantic
openings, restatements of the request, multi-sentence preambles, decorative
headers for small changes, hedge phrases, and closing summaries that repeat the
diff. Keep: one short sentence before tool calls, mid-work updates only when a
finding/blocker/direction-change matters, a 1–2 sentence end-of-turn. Default
shape: one sentence → tool calls → one sentence.

---

## 1. Backend rules

Applies to `src/server/` and the Route Handlers in `src/app/api/**/route.ts` — every Mongoose model, and every migration in `src/server/migrations/`.

### 1.1 SOLID — non-negotiable
- **S** — one reason to change per module. A route handler wires HTTP; a controller guards + validates + envelopes; a service does business logic; a repository does DB. Never one file doing all four.
- **O** — new behaviour goes in a NEW file. Don't edit a stable core to add a case. Use the adapter/strategy shape for every variation point (e.g. a new CSV import source, a new AI provider beside `ai.service.ts`, a new export format under `export/`).
- **L** — implementations of one interface are fully substitutable. No "this one is special, callers do extra work".
- **I** — small, use-case-specific interfaces. Separate types per case, not a superset with optional fields.
- **D** — business logic depends on injected abstractions (the Mongoose model, the `env` via `getEnv()`, the fetcher), not on singletons reached for inside a pure function. Pass primitives in; don't read `process.env` deep inside service logic.

### 1.2 MVC layering — four layers, never collapsed

| Layer | Lives in | Responsibility | Imports |
|---|---|---|---|
| **Model / DTO** | `src/shared/schemas/<feature>.schema.ts` (zod, via `@/shared`) + `src/server/models/<feature>.model.ts` (Mongoose) | Type shapes + validation schemas + the DB document schema. No business logic. A leaf. | zod, mongoose |
| **Repository** | `src/server/<feature>/<feature>.repository.ts` | DB I/O — single-purpose queries. THE only place `<Feature>Model.find/.create/.aggregate/...` runs. | models |
| **Service** | `src/server/<feature>/<feature>.service.ts` | Business logic + orchestration. Pure where possible. Returns a value or a `Result`. | models (types), repositories, other services |
| **Controller** | `src/server/<feature>/<feature>.controller.ts` (bound by the route handler) | `requireAuth()` + validate input + call ONE service + shape the envelope via `ok`/`created`/`fail`. | services, schemas, http helpers |

Rules that follow:
- A Route Handler (`src/app/api/<feature>/route.ts`, and `[id]/route.ts` etc.) is thin — declare `export const runtime = 'nodejs'` and `export const dynamic = 'force-dynamic'` (every route is per-request: DB + auth cookie — `force-dynamic` keeps Next from prerendering/DB-connecting at build), then bind one method per `catchRoute`: `export const GET = catchRoute(c.list)`. No Mongoose calls, no business logic, no filter-building in it.
- A controller MUST NOT contain Mongoose queries inline; it calls ONE service function.
- A service MUST NOT read `req`/`res`/headers/cookies. Primitives in, primitives out — pass `userId`, filters, body as plain args.
- A model MUST NOT import a service or repository. Models are leaves.
- A repository function is ONE query (or one transaction). The transaction-import loop (dedup + `insertMany`) is service-level orchestration calling repository queries — not one repo function.

### 1.3 Validation, errors, results — and the no-raw-try/catch rule
- Validate ALL external input with **zod** in the controller via `validateBody(Schema, await req.json())` / `validateQuery(Schema, req)` (`src/server/http/validate.ts`) BEFORE calling the service. Never trust request body, query, params, or uploaded CSV rows. The helpers return the parsed/coerced value — read from there, don't re-parse.
- Tenant scope is `userId`, resolved server-side by `requireAuth()` from the JWT cookie — **never trusted from the client**. Every Mongoose query is scoped `{ userId, ... }` (see every handler in `transaction.controller.ts` → `transaction.repository.ts`). A query missing `userId` is a security bug.
- Services return a typed value OR a discriminated `Result` (`{ state: "ok"; data } | { state: "error"; reason }`, from `src/server/http/result.ts` via `Ok`/`Err`) for expected failures (not-found, duplicate, quota). The controller maps it: `r.state === 'ok' ? ok(r.data) : fail(r.reason)`. Don't throw across layers for expected failure modes.
- **Centralized error handling via the `catchRoute` wrapper** (`src/server/http/catchRoute.ts`) — the ONE catch. It ensures the DB connection (`connectDB()`), runs the handler, and maps any thrown error to the `{ success: false, error }` envelope (`HttpError` → its status, `CastError` → 404, zod/validation → 400, else 500). Bind every route method through it: `export const GET = catchRoute(c.list)`.

> **Absolute rule — NO raw `try/catch` in any backend feature code.** Controllers,
> services, repositories, and route handlers contain ZERO `try/catch`. `catchRoute`
> is the one and only catch. (`requireAuth` is the framework boundary and keeps its
> `try/catch` for JWT verification; the migration `runner.ts` may keep one.)
> Expected non-exception failures are modelled as a `Result`. Rollback/cleanup that
> "needs" a catch is restructured — for multi-document atomicity use a single
> Mongoose transaction/session, not a TS try/catch.

- Elevated/cross-user operations go through an audited path that writes to `auditLog.model.ts`, not an unscoped query. The Google OAuth callback (`src/app/api/auth/google/callback/route.ts`) verifies the `code` and exchanges it BEFORE issuing the JWT cookie — don't bypass that flow.

### 1.4 Naming + structure
A new backend feature scaffolds (colocated feature folder under `src/server/`):
```
src/shared/schemas/<feature>.schema.ts             # zod DTOs + validation schemas (via @/shared)
src/server/models/<feature>.model.ts               # Mongoose document schema
src/server/<feature>/<feature>.repository.ts        # Mongoose queries, one per function
src/server/<feature>/<feature>.service.ts           # business logic, Result-returning
src/server/<feature>/<feature>.controller.ts        # requireAuth + validate + ONE service call + envelope
src/app/api/<feature>/route.ts                      # runtime='nodejs'; dynamic='force-dynamic'; method = catchRoute(c.method)
```

---

## 2. Frontend rules

Applies to `src/app/`, `src/components/`, `src/hooks/`, `src/contexts/`, `src/lib/` (the Next App Router client surface).

### 2.0 Data architecture — REST + TanStack Query (the data-flow rule)
Every read and write flows through one explicit chain — no layer skipped:
```
page (src/app) → widget (client) → hooks/use<Feature> (TanStack Query read/write)
  → the axios `api` client + the ENDPOINTS registry
  → /api/<feature> (Route Handler) → controller → service → repository → model (the §1 chain)
```
Hard rules:
- **No `services/` god-layer on the client.** All data access lives in `src/hooks/use<Feature>.ts`.
- **UI never imports server modules or Mongoose directly.** Components read/write only through `hooks/use<Feature>`. The hook calls the shared `api` (`src/lib/api.ts`) with a path from the **endpoint registry** (`src/lib/endpoints.ts`) — never a hardcoded URL string. `ENDPOINTS.transactions.list(qs)` is mandatory; inline `/api/...` strings are a bug.
- **Reads → `useQuery`; writes → `useMutation` + `invalidateQueries`.** Mirror `useTransactions.ts` (invalidate `['transactions']` and dependent keys like `['analytics']` on success).
- Pages (`src/app/(app)/<route>/page.tsx`) render ONE client widget (`src/components/<feature>/<Feature>View.tsx`). The `(app)` route group's `layout.tsx` (auth guard) + `AppShell` wrap them. A page itself does not build queries.
- Any component that reads a hook, uses state, or browser APIs is a Client Component (`'use client'` at the top). Pages stay server components that just render the widget.
- Validation: zod-validate the request server-side; the client may parse the response in the hook. No `any` — `unknown` + a parse at boundaries.
- Allowed client-side direct external I/O: the offline queue (`src/lib/offlineQueue.ts`) and PWA sync ONLY. Never a raw DB connection from the browser.

### 2.1 Client/server boundary
This is a Next App Router app. UI under `src/components`, `src/hooks`, `src/contexts`, `src/lib` is client code: **never import `src/server/**` or Mongoose into it.** `src/server/**` runs only inside Route Handlers (`src/app/api/**`). Import shared zod schemas and DTO **types** from `@/shared` with `import type` where only the type is needed; `@/shared` is plain TS (no build step) usable from both sides.

### 2.2 Component layering — element → component → widget; pages compose only
Three tiers, one per file, no inline sub-components:
- **Element** — wraps exactly one semantic HTML tag, typed props for every variant, forwards `className` (via `cn`) + `ref`. Lives in `src/components/ui/`. The ONLY tier that may use a raw banned tag. Existing: `Button`, `Input`, `Textarea`, `Select`, `Card`, `Modal`, `Badge`, `Heading`, `Text`, `Link`, `Label`, `List`, `Table`, `Image`. Add a new variant here, not inline.
- **Component** — 2–5 elements composed for one job (`EmptyState`, `AIInsightCard`, `ProgressRing`, `SkeletonLoader`, `NotificationBell`). Lives in `src/components/`. **Never fetches data** — props only.
- **Widget** — a feature block: a Client Component (`'use client'`) reading via a `use<Feature>` hook. Grouped per feature in `src/components/<feature>/` — the page-body widget is `<Feature>View.tsx`.

A **page** (`src/app/(app)/<route>/page.tsx`) is compose ONLY: the auth guard lives in the `(app)/layout.tsx`; the page imports and returns its page-body widget. No `api` calls, no `.map/.filter/.sort` over fetched data in the page body.

### 2.3 Banned raw tags in feature code
Inside any page/widget/component, JSX MUST NOT contain these raw tags — use the element wrapper. Allowed raw layout primitives in widgets/components only: `<div>`, `<section>`, `<main>`, `<aside>`, `<form>`.

| Banned | Use | Status |
|---|---|---|
| `<button>` | `<Button variant size>` | exists |
| `<input>`/`<textarea>`/`<select>` | `<Input>`/`<Textarea>`/`<Select>` | exist |
| `<h1>`–`<h6>` | `<Heading level>` | exists |
| `<p>` | `<Text variant>` | exists |
| `<span>` | `<Text as="span">` | exists |
| `<a>` | `<Link>` (wraps `next/link`) | exists |
| `<img>` | `<Image>` (wraps `next/image`) | exists |
| `<label>` | `<Label>` | exists |
| `<ul>`/`<ol>`/`<li>` | `<List>`/`<ListItem>` | exists |
| `<table>` (+ children) | `<Table>` family | exists |

Need a wrapper variant that doesn't exist yet? Add it to the element in `src/components/ui/` FIRST, then use it.

### 2.4 No duplication
Before writing a component, grep `src/components`. Duplicate JSX/logic in 2+ places → extract to the right tier in the SAME change. Never ship a third copy.

### 2.5 Styling — Tailwind only
- Tailwind utilities + the single `src/app/globals.css` of base/utilities. No CSS Modules / SCSS / CSS-in-JS / inline `<style>`.
- Use the **token classes** from `tailwind.config.ts` — `brand-*` (accent), `success-*`, `warn-*`, `danger-*`, `slate-*` neutrals, and the `--chart-*` CSS vars for chart series. NEVER raw hex/`[#6366F1]` arbitrary values in feature code; add a token to `tailwind.config.ts` instead.
- Compose classes with the `cn` helper (`src/lib/utils.ts`). One accent (`brand`) per screen.
- Icons from one set only. No emojis in UI. See the `design-system` skill.

### 2.6 Sorting, pagination, filtering — server-side ONLY
Every sort/paginate/filter runs in MongoDB. Pass `page`+`limit`, `sort` column+direction, and filter criteria as params through the hook → query string → `validateQuery(TransactionFilterSchema, req)` → the repository's Mongoose query (see `transaction.controller.ts` `list` → `transaction.repository.ts`). NEVER `items.filter().sort().slice()` after the fetch (ships rows the user shouldn't see, blows the bundle, breaks `hasMore`). Filtering a small static config array (e.g. category-type options) is fine.

### 2.7 Custom hooks — two kinds
Both client, one per file, name starts `use`: **data hooks** (TanStack Query over the `api` client + endpoint registry — `useTransactions`, `useBudgets`, `useGoals`, `useCategories`, `useNotifications`, `useAIInsight`) and **client-concern hooks** (offline queue, theme, optimistic UI, browser APIs). A hook NEVER raw-`fetch`es a URL or touches a DB.

### 2.8 Performance — optimise only when measurably needed
`memo`/`useMemo`/`useCallback`/`useRef` are not defaults. Add one ONLY with a one-line `//` comment stating the specific perf problem. Can't justify it in one line → don't add it. `recharts` re-renders are the usual real case — memoize the data shape, not reflexively.

### 2.9 Types — single source of truth
DB-row/DTO/shared zod schemas live in `src/shared` (`src/shared/schemas`, `src/shared/types`), imported as `@/shared`; app-only UI/form shapes live beside their component. Schema files re-export `export type Foo = z.infer<typeof FooSchema>`. Type/schema files are leaves (no UI/server imports). No `any` — `unknown` + parse.

---

## 3. Cross-cutting

### 3.1 Strict typing — `strict: true` everywhere, no `any` (use `unknown` + a parse). Avoid `as` casts without a runtime check; type the controller's `req: NextRequest` and the `RouteCtx` params once rather than casting. Discriminated unions for state (`Result`, loading/error/data).
### 3.2 Comments — default none; write one ONLY when the *why* is non-obvious (e.g. the CSV `amountIsMinorUnits` conversion, the dedup `hash`). Never explain what well-named code says; never reference the task/PR; never AI-attribution. One line max.
### 3.3 Security — never log secrets (`pino` logger redacts; don't log tokens, JWT secrets, the Gemini key, or full cookies); the OAuth callback exchanges and verifies the Google `code` before issuing the cookie; tenant-scope every query by `userId`; the JWT cookie is httpOnly (+ secure in production) and same-origin (`sameSite: 'lax'`) — keep it that way; store the Gemini API key only in `env` (`GEMINI_API_KEY`), never client-side. Public env is `NEXT_PUBLIC_*` only.
### 3.4 Tests — **vitest** for both surfaces (server route/service/repository, client with `@testing-library/react`). Keep them passing; a change to a tested surface without a matching test is incomplete.
### 3.5 Quality gates before shipping —
```
pnpm typecheck && pnpm lint && pnpm build
pnpm test          # if a tested surface changed
```
One app, one command set — no per-surface filters.

---

## 4. Workflow contracts
1. **Read first** — read the nearest existing feature (`transaction` for backend: `src/server/transaction/*` + `src/app/api/transactions/`; `useTransactions` + `src/components/transaction/TransactionsView.tsx` for frontend) and mirror it.
2. **Ask, don't assume** — ambiguous requirement / two readings / new convention → ask one question. Don't ask what reading the code answers.
3. **Plan before non-trivial** — >1 file, >~30 lines, or non-obvious ordering → short plan (files, functions, order, what's NOT touched), surface, agree, then write.
4. **Cover edge cases before "done"** — empty/null, large CSV, duplicate-hash imports, concurrent mutations, missing-auth (401) and wrong-owner (404) paths, offline-queue replay, malformed payloads, stale TanStack cache, first-run empty states. Handle in code or name what's out of scope.
5. **Override** — the user can override a specific rule for a named scope; follow it there, note the trade-off in one sentence, don't retroactively change other files.
