'use client';

import { useEffect, useRef, useState } from 'react';

// Animate a number from its previous value to `target` (easeOutCubic).
// Respects prefers-reduced-motion and SSR (snaps to target).
export function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    if (typeof window === 'undefined') { setValue(target); return; }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setValue(target); fromRef.current = target; return; }

    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (target - from) * eased;
      setValue(v);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}
