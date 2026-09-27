import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './useMediaQuery.js';

/**
 * Animated count-up for dashboard numerals (§10.2 / §11.2).
 * Respects prefers-reduced-motion by jumping straight to the value.
 */
export function useCountUp(target, duration = 700) {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(reduced ? target : 0);
  const fromRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (reduced) {
      setValue(target);
      return undefined;
    }
    const from = fromRef.current;
    const delta = target - from;
    if (delta === 0) return undefined;

    const start = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      const next = from + delta * eased;
      setValue(next);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
      else fromRef.current = target;
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, reduced]);

  useEffect(() => {
    if (reduced) fromRef.current = target;
  }, [reduced, target]);

  return value;
}
