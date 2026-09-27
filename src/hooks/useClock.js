import { useEffect, useState } from 'react';

/**
 * 1 Hz wall clock, aligned to the next second boundary.
 * Used ONLY by isolated leaf components (§4.2) so the tree never re-renders.
 */
export function useClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timeout;
    let interval;
    const align = 1000 - (Date.now() % 1000);
    timeout = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 1000);
    }, align);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  return now;
}
