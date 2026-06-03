---
name: design-system
description: >-
  Personal Finance Tracker visual + component standards. Load when writing or editing any client
  UI (src/**/*.tsx), creating an element/component/widget, choosing colors,
  spacing, type, or icons, or touching tailwind.config.ts / src/app/globals.css.
  Carries the real design tokens and the banned-raw-tag rules.
---

# Personal Finance Tracker design system

Client UI (`src/components/**`, widgets in `src/app/**`). Tailwind + the tokens in
`tailwind.config.ts` and `src/app/globals.css`. Reference element: `src/components/ui/Button.tsx`.

## Architectural UI rules (verbatim from CLAUDE.md §2.2–§2.5)
- **Three tiers:** element (`src/components/ui/`, wraps one semantic tag, forwards `className` via `cn` + `ref`) → component (`src/components/`, 2–5 elements, **props only, never fetches**) → widget (`src/components/<feature>/<Feature>View.tsx`, fetches via a `use<Feature>` hook). Pages (`src/app/(app)/<route>/page.tsx`) compose only.
- **Banned raw tags** in feature JSX — use the `src/components/ui` wrapper: `<button>`→`Button`, `<input>/<textarea>/<select>`→`Input/Textarea/Select`, `<h1-6>`→`Heading`, `<p>`→`Text`, `<span>`→`Text as="span"`, `<a>`→`Link` (wraps `next/link`), `<img>`→`Image` (wraps `next/image`), `<label>`→`Label`, `<ul/ol/li>`→`List/ListItem`, `<table>`→`Table`. Allowed raw: `<div> <section> <main> <aside> <form>`. **All wrappers exist** — add a variant to the element rather than reaching for the raw tag.
- **Tailwind only.** No CSS Modules / SCSS / CSS-in-JS / inline `<style>` / `style={{}}`. Compose with `cn` (`src/lib/utils.ts`).
- **Tokens not raw values.** Use the named token classes below; NEVER an arbitrary `[#hex]` in feature code — add a token to `tailwind.config.ts` instead.
- **Accent budget: one emphasis color (`brand`) per screen.** Reserve `success/warn/danger` for status only.
- Buttons: one radius scale (`rounded-lg` sm/md, `rounded-xl` lg — already in `Button`). Numbers in tables/stats: tabular alignment. **Icons: one set only (lucide). No *decorative* emojis** — but category/goal `icon` fields are emoji *data* (seeded, user-editable) and are rendered as-is next to their label; that's data, not UI decoration.

## Theme: neutral slate + steel-blue, glassy (current)
The palette is intentionally **neutral/classy, not pink** — `brand` is **steel blue**, surfaces lean on slate/`ink` neutrals, and cards use a frosted **glass** treatment. Don't reintroduce violet/fuchsia/pink accents. (See the `ui-aesthetic-preference` memory.)

## Design tokens (real — from `tailwind.config.ts` + `src/app/globals.css`)

**Brand — steel blue** (the single emphasis color)
| Token | Hex | | Token | Hex |
|---|---|---|---|---|
| `brand-50` | `#EFF6FF` | | `brand-500` | `#3B82F6` (base accent) |
| `brand-300` | `#93C5FD` | | `brand-600` | `#2563EB` (primary button) |
| `brand-400` | `#60A5FA` | | `brand-700` | `#1D4ED8` (hover) |
| | | | `brand-900` | `#1E3A8A` |

**Secondary / tertiary** — `accent` = neutral slate-steel (`accent-500 #647391`, `accent-600 #4D5B77`; used by `IconBadge tone="accent"`); `aqua` = cyan (`aqua-500 #06B6D4`).

**Status** (status/feedback only, not decoration)
| Role | 500 | 600/700 |
|---|---|---|
| `success` (mint-green) | `#22D3A7` | `#12B88C` / `#0E8E6C` |
| `warn` (amber) | `#F59E0B` | `#D97706` |
| `danger` (rose-red) | `#FB5C6B` | `#E11D48` |

**Neutrals** — Tailwind `slate-*` (light) + `ink-*` dark surfaces (`ink-950 #0B0B14`, `ink-900 #14141F`, `ink-800 #20202F`). Surfaces/text: `bg-slate-50 text-slate-900` / `dark:bg-ink-950 dark:text-slate-100`. Dark mode is `class`-based (`ThemeContext`).

**Gradients / glass** — `bg-aurora` = `slate-700 → blue-600 → sky` (wordmark, FABs, active nav, `IconBadge gradient`); `bg-aurora-soft` (gradient Card); the `.glass` utility (`globals.css` — translucent + `backdrop-blur-xl` + highlight ring) and the **glass-default `Card`** (`variant="default"` is translucent backdrop-blur; `glass`/`gradient`/`plain` also available). `shadow-glow` uses steel-blue.

**Chart series** — CSS vars in `globals.css` (light; brighter in `.dark`), use for `recharts` series in order:
`--chart-1 #2563EB` (blue) · `--chart-2 #0EA5E9` (sky) · `--chart-3 #06B6D4` (cyan) · `--chart-4 #12B88C` (mint) · `--chart-5 #F59E0B` (amber) · `--chart-6 #64748B` (slate) · `--chart-7 #6366F1` (indigo) · `--chart-8 #14B8A6` (teal). No pink/fuchsia in charts.

**Type** — body **Exo 2** (`--font-body`, `font-sans`), display/numbers **Chakra Petch** (`--font-display`, `font-display`), both via `next/font` in `layout.tsx`. Size/weight via the `Heading level` / `Text variant` elements (`src/components/ui/`) — use them.

**Focus ring** — global `focus-visible:ring-2 ring-brand-500 ring-offset-2` (in `globals.css`); element wrappers re-apply it.

**Motion** — `animate-fade-in` · `animate-slide-up` · `animate-shimmer` (skeletons) · `animate-float`/`pulse-glow`/`gradient-shift`/`pop`/`fall` (e.g. `ConfettiBurst`). `ConfettiBurst` colors come from the `--chart-*` vars.

## When you need a token that doesn't exist
Add it to `tailwind.config.ts` `theme.extend` (a new `brand` shade, a chart var in `globals.css`) — never inline an arbitrary hex in a component.
