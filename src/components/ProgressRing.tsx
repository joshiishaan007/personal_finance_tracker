'use client';

import { useId } from 'react';
import { Check } from 'lucide-react';
import { GradientText } from '@/components/ui/GradientText';
import { Text } from '@/components/ui/Text';

interface Props {
  pct: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  // Override the ring centre (e.g. an icon) instead of the default %/tick.
  center?: React.ReactNode;
}

// No `color` → Aurora gradient stroke (var(--chart-1)→var(--chart-2)); a passed
// `color` (CSS var or hex from a goal) is used as a solid stroke instead.
// Centre shows the % until complete, then a tick — both in the ring's own colour.
export function ProgressRing({ pct, size = 64, strokeWidth = 6, color, label, center }: Props) {
  const id = useId().replace(/:/g, '');
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(pct, 100) / 100) * circumference;
  const useGradient = !color;
  const stroke = useGradient ? `url(#ring-${id})` : color;
  const accent = useGradient ? 'var(--chart-1)' : color;
  const done = pct >= 100;

  return (
    <div className="relative inline-flex items-center justify-center" role="img" aria-label={label ?? `${Math.round(pct)}%`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={`ring-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" />
            <stop offset="100%" stopColor="var(--chart-2)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-ink-700"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>

      {center ? (
        <div className="absolute inset-0 flex items-center justify-center">{center}</div>
      ) : done ? (
        <Check size={Math.round(size * 0.44)} strokeWidth={3} className="absolute" style={{ color: accent }} aria-hidden />
      ) : useGradient ? (
        <GradientText as="span" className="absolute text-xs font-bold">{Math.round(pct)}%</GradientText>
      ) : (
        <Text as="span" className="absolute text-xs font-bold" style={{ color }}>{Math.round(pct)}%</Text>
      )}
    </div>
  );
}
