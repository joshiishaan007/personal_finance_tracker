'use client';

import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
}

// Token-backed chart series vars (defined in globals.css) instead of raw hex literals.
const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
];

export function ConfettiBurst({ trigger }: { trigger: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!trigger || prefersReduced) return;
    const ps: Particle[] = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[i % COLORS.length]!,
      delay: Math.random() * 400,
      duration: 600 + Math.random() * 800,
    }));
    setParticles(ps);
    const t = setTimeout(() => setParticles([]), 2000);
    return () => clearTimeout(t);
  }, [trigger]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden" aria-hidden>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-2 h-2 rounded-sm -top-2 animate-fall"
          style={{
            left: `${p.x}%`,
            backgroundColor: p.color,
            '--fall-duration': `${p.duration}ms`,
            '--fall-delay': `${p.delay}ms`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
