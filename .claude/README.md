# `.claude/` — Personal Finance Tracker agent context

Carries the SOLID/MVC backend rules + REST/component-tier frontend rules from
`CLAUDE.md`, adapted to this repo's real stack: ONE **Next.js 14 App Router** app —
**Route Handlers + Mongoose/MongoDB · React 18 + TanStack Query + axios + Tailwind ·
zod via `@/shared`** (path alias `@/* → src/*`).

`CLAUDE.md` (repo root) is the rulebook, auto-loaded every session. The skills
below auto-load by relevance.

## Skills

| Skill | Loads when |
|---|---|
| `coding-standards` | Any change under `src/server`, the App Router client (`src/app`/`src/components`/`src/hooks`/`src/lib`), or `src/shared`; scaffolding a feature/route/hook/component/model/migration. Restates CLAUDE.md §1–§4 with the reference feature (`transaction`). |
| `design-system` | Client UI work (`src/**/*.tsx`), elements/components/widgets, colors/type/icons, `tailwind.config.ts` / `src/app/globals.css`. Carries the real tokens + banned-tag rules. |
| `client` | The App Router client — `src/app`, `src/components`, `src/hooks`, `src/contexts`, `src/lib`. |
| `server` | The backend — `src/server/**` + `src/app/api/**` route handlers, http helpers, models, migrations, config. |
| `shared` | `src/shared/**` (`@/shared`) — zod schemas, DTO types, money helpers; cross-boundary contracts. |
| `database` | Mongoose models + migrations; collections, fields, indexes, tenant scoping, money storage. |

## Agents

| Agent | Use |
|---|---|
| `standards-reviewer` | Read-only audit of a diff against the CLAUDE.md rules grep can't catch (userId scoping, no try/catch, `catchRoute`/`runtime` wiring, layering, money-as-integer, data-flow chain). Run before shipping / pre-PR. |

> Per-surface `server-dev`/`client-dev` agents were intentionally NOT created —
> they duplicate the auto-loading skills and add no speed. Add them only if you
> start delegating large parallel tasks.

## Hooks (`hooks/`, wired in `settings.json`)

All **warn-only, never block**. POSIX `sh`, `grep`/`sed`/`echo` only (run via the
bundled shell on Windows).

| Hook | Event | Warns on |
|---|---|---|
| `check-banned-tags.sh` | PostToolUse(Edit\|Write) | Raw banned HTML tags in feature `.tsx` under `src/` (exempts `src/components/ui/`). |
| `check-raw-palette.sh` | PostToolUse(Edit\|Write) | Arbitrary hex / `[#...]` color in `src/` code (exempts `globals.css`, `tailwind.config.ts`). |
| `check-css-files.sh` | PostToolUse(Edit\|Write) | Banned stylesheet types (SCSS/Sass/CSS Modules/styled); stray `.css` beyond `src/app/globals.css`. |
| `remind-check.sh` | PostToolUse(Edit\|Write) | Reminder to run the quality gates after a `src/` source edit. |
| `session-banner.sh` | SessionStart | Prints the active standards reference. |

## Layout
The repo is a single Next.js 14 app at the root. The architecture (4-layer
backend, data-flow direction, component tiers, error model) is fixed; the skills
above carry the concrete stack names + paths. Hand-edit freely and commit.
