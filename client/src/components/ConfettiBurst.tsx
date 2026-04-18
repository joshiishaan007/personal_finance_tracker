import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
}

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];

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
          className="absolute w-2 h-2 rounded-sm"
          style={{
            left: `${p.x}%`,
            top: '-8px',
            backgroundColor: p.color,
            animation: `fall ${p.duration}ms ease-in ${p.delay}ms forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          to { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
