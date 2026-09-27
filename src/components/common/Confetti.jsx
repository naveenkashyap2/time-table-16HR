import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery.js';

const COLORS = ['var(--primary)', 'var(--secondary)', 'var(--accent)', '#fbbf24', '#34d399'];

/**
 * Confetti-lite: pure CSS keyframes, ~28 divs, self-cleaning.
 * Triggered by the `studyloop:confetti` window event (§9.6).
 * Fully disabled under prefers-reduced-motion.
 */
export default function Confetti() {
  const reduced = usePrefersReducedMotion();
  const [burst, setBurst] = useState(null);

  useEffect(() => {
    if (reduced) return undefined;
    let timeout;
    const onBurst = () => {
      const bits = Array.from({ length: 28 }, (_, i) => ({
        id: `${Date.now()}-${i}`,
        left: Math.random() * 100,
        delay: Math.random() * 0.35,
        duration: 1.8 + Math.random() * 1.1,
        color: COLORS[i % COLORS.length],
        rotate: Math.random() * 360,
      }));
      setBurst(bits);
      clearTimeout(timeout);
      timeout = setTimeout(() => setBurst(null), 3200);
    };
    window.addEventListener('studyloop:confetti', onBurst);
    return () => {
      window.removeEventListener('studyloop:confetti', onBurst);
      clearTimeout(timeout);
    };
  }, [reduced]);

  if (!burst) return null;

  return (
    <div className="confetti-layer" aria-hidden="true">
      {burst.map((b) => (
        <span
          key={b.id}
          className="confetti-bit"
          style={{
            left: `${b.left}%`,
            background: b.color,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
            transform: `rotate(${b.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
