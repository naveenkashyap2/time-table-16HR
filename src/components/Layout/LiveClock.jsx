import { memo } from 'react';
import { Clock } from 'lucide-react';
import { useClock } from '../../hooks/useClock.js';

/**
 * Isolated 1 Hz clock (§10.2 / §4.2).
 * This is the ONLY component that re-renders every second for the wall clock.
 */
function LiveClock({ withIcon = true, withSeconds = false, className = 'clock-chip' }) {
  const now = useClock();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  return (
    <span className={className}>
      {withIcon ? <Clock size={15} aria-hidden="true" /> : null}
      <time className="tnum" dateTime={`${hh}:${mm}`}>
        {hh}:{mm}
        {withSeconds ? `:${ss}` : ''}
      </time>
    </span>
  );
}

export default memo(LiveClock);
