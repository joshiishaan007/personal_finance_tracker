/**
 * xpensr logo system.
 *
 * LogoMark — icon-only (dark navy + gold chart/orbit), square.
 * Logo     — horizontal lockup: LogoMark + wordmark.
 *
 * The dark-navy background is baked in so the gold mark looks
 * identical on both light and dark surfaces (matches the brand reference).
 * The wordmark "pensr" uses currentColor so it adapts to the container.
 */

// ─── Shared defs ────────────────────────────────────────────────────────────

function GoldDefs({ prefix }: { prefix: string }) {
  return (
    <defs>
      {/* Dark navy bg */}
      <linearGradient id={`${prefix}-bg`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#14213D" />
        <stop offset="100%" stopColor="#090E1C" />
      </linearGradient>
      {/* Top-lit gold: bright at top → deep at bottom */}
      <linearGradient
        id={`${prefix}-gold`}
        x1="30" y1="2" x2="30" y2="58"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%"   stopColor="#FFD060" />
        <stop offset="55%"  stopColor="#E09410" />
        <stop offset="100%" stopColor="#B8730A" />
      </linearGradient>
      {/* Subtle bg gloss */}
      <linearGradient id={`${prefix}-gl`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="white" stopOpacity="0.07" />
        <stop offset="100%" stopColor="white" stopOpacity="0"    />
      </linearGradient>
    </defs>
  );
}

// ─── Mark elements (60 × 60 viewBox) ────────────────────────────────────────
//
// Orbital ring: centre (30, 31.2), radius 22.2
//   Gap -60°→-30° (upper-right):
//     -60°: (30+11.1, 31.2-19.22) = (41.1, 12.0)
//     -30°: (30+19.22, 31.2-11.1) = (49.2, 20.1)
//   Arc  : M 49.2 20.1  A 22.2 22.2  0 1 0  41.1 12
//
// Bars (bottom y = 44.4):
//   bar1  x=14.4  y=37.2  w=4.5  h=7.2
//   bar2  x=21    y=33    w=4.5  h=11.4
//   bar3  x=27.6  y=28.2  w=4.5  h=16.2
//   bar4  x=34.2  y=22.8  w=4.5  h=21.6
//
// Arrow:
//   body  (37.8, 25.2) → (43.8, 16.8)
//   tip   (47.4, 13.2)
//   head  M 47.4 13.2  L 46.2 18  L 42.6 15 Z

function MarkElements({ prefix }: { prefix: string }) {
  const bg   = `url(#${prefix}-bg)`;
  const gold = `url(#${prefix}-gold)`;
  const gl   = `url(#${prefix}-gl)`;
  return (
    <>
      {/* Container */}
      <rect width="60" height="60" rx="13" fill={bg} />
      <rect width="60" height="60" rx="13" fill={gl} />
      <rect x="1" y="1" width="58" height="58" rx="12"
            fill="none" stroke="#E09410" strokeOpacity="0.25" strokeWidth="1" />

      {/* Orbital ring with gap at upper-right */}
      <path
        d="M 49.2 20.1 A 22.2 22.2 0 1 0 41.1 12"
        fill="none" stroke={gold} strokeWidth="2" strokeLinecap="round"
      />

      {/* Ascending bars */}
      <rect x="14.4" y="37.2" width="4.5" height="7.2"  rx="1" fill={gold} />
      <rect x="21"   y="33"   width="4.5" height="11.4" rx="1" fill={gold} />
      <rect x="27.6" y="28.2" width="4.5" height="16.2" rx="1" fill={gold} />
      <rect x="34.2" y="22.8" width="4.5" height="21.6" rx="1" fill={gold} />

      {/* Arrow body */}
      <line x1="37.8" y1="25.2" x2="43.8" y2="16.8"
            stroke={gold} strokeWidth="2" strokeLinecap="round" />
      {/* Arrowhead */}
      <path d="M 47.4 13.2 L 46.2 18 L 42.6 15 Z" fill={gold} />
    </>
  );
}

// ─── Public components ───────────────────────────────────────────────────────

interface SvgProps { className?: string }

/** Square icon mark only — use wherever just the icon badge is needed. */
export function LogoMark({ className }: SvgProps) {
  return (
    <svg
      viewBox="0 0 60 60"
      className={className}
      aria-label="xpensr"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>xpensr</title>
      <GoldDefs prefix="xlm" />
      <MarkElements prefix="xlm" />
    </svg>
  );
}

/**
 * Horizontal logo lockup: icon mark + wordmark.
 * Size with a Tailwind height class, e.g. className="h-9 w-auto".
 */
export function Logo({ className }: SvgProps) {
  return (
    <svg
      viewBox="0 0 196 60"
      className={className}
      aria-label="xpensr"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>xpensr</title>
      <GoldDefs prefix="xl" />
      {/* Wordmark "x" gradient — horizontal, spans the first glyph (x=72..86 at 28px bold) */}
      <defs>
        <linearGradient
          id="xl-wm"
          x1="72" y1="0" x2="86" y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%"   stopColor="#FFD060" />
          <stop offset="100%" stopColor="#E09410" />
        </linearGradient>
      </defs>

      {/* Icon mark (60 × 60) */}
      <MarkElements prefix="xl" />

      {/* Wordmark "xpensr"
          "x"     → gold gradient (visual tie to the mark)
          "pensr" → currentColor (adapts to light/dark container)        */}
      <text
        x="72"
        y="40"
        fontFamily="'Exo 2', system-ui, sans-serif"
        fontSize="28"
        fontWeight="700"
        letterSpacing="-1"
      >
        <tspan fill="url(#xl-wm)">x</tspan>
        <tspan fill="currentColor">pensr</tspan>
      </text>
    </svg>
  );
}
