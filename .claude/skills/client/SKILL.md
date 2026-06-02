---
name: client
description: >-
  Personal Finance Tracker frontend (Next.js 14 App Router). Load when editing anything under
  src/app, src/components, src/hooks, src/contexts, src/lib — pages, widgets,
  components, hooks — or adding a screen, data hook, form, chart, or UI element.
  Pairs with the design-system skill.
---

# client — Personal Finance Tracker web app (`src/app`, `src/components`, `src/hooks`, ...)

The frontend half of the single Next.js 14 app. App Router pages render client
widgets that fetch via TanStack Query over axios. Same-origin with the API.

## Stack
Next.js 14 (App Router) · React 18 · @tanstack/react-query 5 (+ devtools) · axios · react-hook-form + @hookform/resolvers + zod · recharts (charts) · date-fns · Tailwind 3. Tests: vitest + @testing-library/react + jsdom.

## Layout
- `src/app/layout.tsx` / `src/app/providers.tsx` — root layout + the QueryClient/Auth/Theme providers.
- `src/app/(app)/<route>/page.tsx` — one per screen (dashboard, transactions, budgets, goals, net-worth, pl, recurring, analytics, reports, settings, profile). Each renders ONE widget.
- `src/app/(app)/layout.tsx` — the auth guard + `AppShell` (nav). `(auth)/` holds the login flow; `onboarding/` the first-run flow.
- `src/app/api/**` — Route Handlers (the backend; see the `server` skill).
- `src/components/ui/` — **element tier**: `Button Input Textarea Select Card Modal Badge Heading Text Link Label List Table Image`.
- `src/components/` — **component tier**: `EmptyState AIInsightCard ProgressRing SkeletonLoader NotificationBell CommandPalette ConfettiBurst`, plus per-feature **widget** folders (`transaction/TransactionsView.tsx`, `budget/`, `goal/`, ...).
- `src/hooks/` — data hooks: `useTransactions useBudgets useGoals useCategories useRecurring useNetWorth useNotifications useAnalytics useProfitLoss useReports useAIInsight useUser`.
- `src/contexts/` — `AuthContext` (auth/guard), theme.
- `src/lib/` — `api.ts` (axios, same-origin, `withCredentials`), `endpoints.ts` (the ENDPOINTS registry), `queryClient.ts`, `offlineQueue.ts`, `utils.ts` (`cn`, formatters).
- `middleware.ts` (repo root) — cookie-presence page guard; bounces visitors with no `token` cookie off protected pages (full JWT check stays server-side in `requireAuth`).

## Data flow (§2.0) — never skip a layer
```
page (src/app) → widget → hooks/use<Feature> (useQuery/useMutation) → api (axios) + ENDPOINTS
  → /api/<feature> → server
```
- Data access ONLY in `src/hooks/use<Feature>.ts`. Reference: `useTransactions.ts` — `useQuery` for reads, `useMutation` + `invalidateQueries(['transactions'])` (+ `['analytics']`) for writes.
- Hooks build paths from `ENDPOINTS` (`src/lib/endpoints.ts`) — `ENDPOINTS.transactions.list(qs)` — never an inline URL string. Never raw `fetch`.
- `api` (`src/lib/api.ts`) is same-origin (`baseURL: ''`, `withCredentials: true`) — the httpOnly JWT cookie rides along; no Authorization header to manage.
- Pages are server components that render one widget; the guard lives in `(app)/layout.tsx`. Pages don't build queries or post-process fetched data.

## Conventions
- **`'use client'`** at the top of any widget/component/context/hook that uses state, effects, hooks, or browser APIs. Pages stay server components.
- **Component tiers + banned raw tags** — see the `design-system` skill. The `src/components/ui` wrappers all exist; add a variant to one rather than reaching for the raw tag.
- **Tailwind only**, token classes, `cn` to compose. No CSS Modules/SCSS/CSS-in-JS/inline style.
- **Forms:** react-hook-form + zod resolver; the zod schema comes from `@/shared` where one exists (single source of truth).
- **Server-side sort/paginate/filter only** — pass params through the hook's query string (see `useTransactions` building `URLSearchParams`); never post-fetch `.filter().sort().slice()`.
- **No `any`** — import DTO types from `@/shared` with `import type`; parse `unknown` at the hook boundary.
- **Never import `src/server/**` or Mongoose** into client code — only call through hooks → `api` → Route Handlers.

## Sharp edges (verified)
- **Same-origin, no CORS.** `api` baseURL is `''`; always go through `ENDPOINTS` (paths are `/api/...`). No cross-origin cookie hacks remain.
- **Two guards:** `middleware.ts` does a cheap cookie-presence redirect for protected pages; `(app)/layout.tsx` + `AuthContext` do the real auth-state gate. Add a new protected page under `(app)` and it's covered by both.
- **Offline queue** (`src/lib/offlineQueue.ts`) replays writes when back online — mutations must be idempotent-safe (the server dedups transactions by hash). Consider replay when adding a new write.
- **`Image`/`Link` wrappers** wrap `next/image` / `next/link` — use them (not the raw Next components) so the element tier stays the single styling point.

## Quality gates
```
pnpm typecheck && pnpm lint && pnpm build && pnpm test
```
Dev: `pnpm dev` (Next).
