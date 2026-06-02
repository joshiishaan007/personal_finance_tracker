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
- Buttons: one radius scale (`rounded-lg` sm/md, `rounded-xl` lg — already in `Button`). Numbers in tables/stats: tabular alignment. **Icons: one set only. No emojis in UI.**

## Design tokens (detected — real, from `tailwind.config.ts` + `src/app/globals.css`)

**Brand / accent — indigo** (the single emphasis color)
| Token | Hex | | Token | Hex |
|---|---|---|---|---|
| `brand-50` | `#EEF2FF` | | `brand-500` | `#6366F1` (base accent) |
| `brand-100` | `#E0E7FF` | | `brand-600` | `#4F46E5` (primary button) |
| `brand-200` | `#C7D2FE` | | `brand-700` | `#4338CA` (hover) |
| `brand-400` | `#818CF8` | | `brand-900` | `#312E81` |

**Status** (status/feedback only, not decoration)
| Role | 50 | 500 | 700 |
|---|---|---|---|
| `success` (green) | `#ECFDF5` | `#10B981` | `#047857` |
| `warn` (amber) | `#FFFBEB` | `#F59E0B` | `#B45309` |
| `danger` (red) | `#FEF2F2` | `#EF4444` | `#B91C1C` |

**Neutrals** — Tailwind `slate-*`. Surfaces/text: `bg-slate-50 text-slate-900` (light) / `dark:bg-slate-900 dark:text-slate-50`. Dark mode is `class`-based (`ThemeContext`).

**Chart series** — CSS vars in `globals.css`, use for `recharts` series in order:
`--chart-1 #6366F1` · `--chart-2 #10B981` · `--chart-3 #F59E0B` · `--chart-4 #EF4444` · `--chart-5 #8B5CF6` · `--chart-6 #EC4899`.

**Type** — font `Inter, system-ui, sans-serif` (`font-sans`). Size/weight via Tailwind utilities; the `Heading level` / `Text variant` elements (`src/components/ui/`) centralize the scale — use them.

**Focus ring** — global `focus-visible:ring-2 ring-brand-500 ring-offset-2` (in `globals.css`); element wrappers re-apply it.

**Motion** — `animate-fade-in` (150ms), `animate-slide-up` (150ms), `animate-shimmer` (skeletons, via the `.skeleton` utility). Keep transitions ≤150ms.

## When you need a token that doesn't exist
Add it to `tailwind.config.ts` `theme.extend` (a new `brand` shade, a chart var in `globals.css`) — never inline an arbitrary hex in a component.
