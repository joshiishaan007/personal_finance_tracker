---
name: database
description: >-
  Personal Finance Tracker data layer — Mongoose models (src/server/models/**) and migrations
  (src/server/migrations/**) on MongoDB. Load when adding/changing a collection,
  field, index, or migration, or reasoning about tenant scoping, money storage,
  or query performance.
---

# database — Mongoose models + migrations (`src/server/models`, `src/server/migrations`)

MongoDB via Mongoose 8. DB name `personal` (set as the `dbName` option in both
`src/server/db.ts` and `migrations/runner.ts` — they MUST match or migrations seed
a database the app never reads). No SQL, no RLS — **tenant isolation is
application-enforced**: every query scopes by `userId`.

## Collections (`*.model.ts`)
`user` · `transaction` · `category` · `budget` · `goal` · `recurringRule` · `netWorthSnapshot` · `notification` · `aiInsight` · `auditLog`. Global rows (e.g. default categories) use `isDefault: true` and have no `userId`.

## Model conventions (verified from `transaction.model.ts`)
- Export an `I<Name>` interface (`extends Document`) + the `<Name>Model`. Reference: `transaction.model.ts`.
- **HMR/serverless-safe registration (REQUIRED):** register as `export const <Name>Model = (models.<Name> as Model<I<Name>>) || model<I<Name>>('<Name>', <schema>);` — NEVER a bare `model('<Name>', schema)`. Next.js dev hot-reload (and serverless re-eval) re-runs the module; a bare `model(...)` throws `OverwriteModelError: Cannot overwrite '<Name>' model once compiled`. Import `models` + `Model` alongside `model`/`Schema` from `mongoose`.
- `{ timestamps: true }` → `createdAt`/`updatedAt`. `schemaVersion: Number` on documents for forward migration.
- User-owned docs have `userId: { type: ObjectId, ref: 'User', required: true }`. Relations use `ref` + `ObjectId`.
- **Money is an integer** (`amount: Number`, minor units / paise — never a float). Mirror the shared `CreateTransactionSchema` (`z.number().int().positive()`); use `toMinorUnits`/`formatAmount` from `@/shared` for conversion.
- **Indexes are compound and `userId`-first**, matching access patterns: `{ userId:1, date:-1 }`, `{ userId:1, type:1 }`, `{ userId:1, categoryId:1, date:-1 }`, `{ userId:1, importBatchId:1 }`, `{ userId:1, hash:1 }`. Add an index for any new filter/sort path you introduce — server-side sort/filter (§2.6) relies on them.
- Dedup pattern: a per-user `hash` (`sha256(date|amount|note)`) + the `{ userId:1, hash:1 }` index back CSV-import idempotency.

## Migrations (`migrations/`)
- **Ordinal, numbered files**: `NNN_description.ts` (`001_seed_default_categories.ts`). Each `export default { version, description, async up(mongoose) }`.
- **Register in `runner.ts`**: import the file and add it to the `migrations[]` array — the runner does NOT auto-discover.
- Runner tracks applied versions in a `_Migration` collection (unique `version`) and skips already-applied ones. Run: `pnpm migrate` (`tsx src/server/migrations/runner.ts`).
- **Migrations must be idempotent** (e.g. `001` early-returns if defaults already exist) — they may be re-run against a partially-migrated DB.
- There is no down/rollback path — write forward-only, additive migrations; backfill in a new ordinal rather than mutating an old one.

## Sharp edges
- **No RLS — a query missing `userId` leaks across tenants.** Every read/write/delete on a user-owned collection MUST include `{ userId }`. The repository layer (§1) is where this is enforced.
- Mongoose update ops (`findOneAndUpdate`) need `{ new: true }` to return the updated doc; deletes/updates scope by `{ _id, userId }` (see `transaction.repository.ts`).
- Category seed colors are raw hex (data, not UI) — distinct from the Tailwind tokens; don't confuse the two.
- `runner.ts` reads `MONGODB_URI` and hardcodes `dbName: 'personal'` — it MUST equal the `dbName` in `src/server/db.ts`, else `pnpm migrate` seeds default categories into a database the app never opens.
- **Atlas/`mongodb+srv` gotchas (local dev):** the URI password must be percent-encoded (e.g. `@` → `%40`); `db.ts` falls back to public DNS (`8.8.8.8`/`1.1.1.1`) when Node's resolver is a dead `127.0.0.1` loopback (a Windows quirk that breaks SRV lookups); the OAuth client must allow `http://localhost:3000/api/auth/google/callback`.
