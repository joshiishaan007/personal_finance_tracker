---
name: shared
description: >-
  Personal Finance Tracker shared contracts (src/shared/, imported as @/shared) — the single
  source of truth for zod schemas, DTO types, currency/money helpers, and enums
  used by BOTH the client and the server. Load when editing src/shared/**, adding
  a schema/type, or changing a validation contract that crosses the client/server
  boundary.
---

# shared — `@/shared` (`src/shared/`)

The contract layer. Plain TypeScript inside the single Next.js app — zod schemas +
types imported by both the client (`src/components`, `src/hooks`) and the server
(`src/server`) via the `@/shared` alias. **No separate package, no build step** —
edit the `.ts` and consumers see it immediately.

## Layout
- `src/shared/schemas/*.schema.ts` — zod schemas per domain: `user transaction category budget goal recurringRule netWorth notification aiInsight ai engagement`. Each exports `Create*Schema`, `Update*Schema`, filter schemas, and the inferred types (`export type Foo = z.infer<typeof FooSchema>`). `ai.schema` = `QuickParseRequest`/`ParsedDraft` (NL quick-add); `engagement.schema` = `DailyEngagement` (streak + today snapshot DTO). `transaction.schema` `CreateTransactionSchema` now has an optional `clientId` (offline idempotency key).
- `src/shared/types/common.ts` — currency list + symbols, the domain string-union types (`TransactionType`, `PaymentMethod`, `BudgetPeriod`, etc.), and the **money helpers** `toMinorUnits` / `formatAmount`.
- `src/shared/types/api.ts` — `ApiResponse<T>`, `PaginatedResponse<T>`, `ApiError` envelope types.
- `src/shared/index.ts` — barrel re-exporting everything; import from `@/shared`. Add new modules here.

## Rules
- **This is the ONLY source of truth** for any shape that crosses the wire. A schema duplicated in client or server is a bug — import it from `@/shared`.
- Schema files are **leaves**: zod only, no imports from `src/server`, `src/components`, or any UI/DB code.
- Every schema re-exports its inferred type. The server `validateBody`/`validateQuery` helpers and the client react-hook-form resolvers consume the SAME schema.
- **Money is integer minor units, never floats.** `amount` is `z.number().int().positive()` (paise/cents). Use `toMinorUnits` / `formatAmount` (JPY has 0 decimals — they handle it). Never do `amount / 100` ad hoc in feature code.

## Sharp edges (verified)
- **No build step** — `@/shared` resolves to `src/shared/*` via the `@/*` tsconfig path alias. Edit `src/shared/`; there is no `dist/`. A typecheck not seeing your new export means you forgot to barrel it in `index.ts`.
- Filter schemas use `z.coerce.*` (query params arrive as strings) — keep filter fields coercible; `validateQuery` folds repeated keys into arrays.
- Same file is imported by Node (Route Handlers) and the browser bundle — keep it dependency-light (zod only) so it's safe on both.
