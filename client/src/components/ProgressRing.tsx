interface Props {
  pct: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

export function ProgressRing({ pct, size = 64, strokeWidth = 6, color = '#6366F1', label }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(pct, 100) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" role="img" aria-label={label ?? `${Math.round(pct)}%`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-700"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span className="absolute text-xs font-bold" style={{ color }}>
        {Math.round(pct)}%
      </span>
    </div>
  );
}
