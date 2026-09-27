import { memo } from 'react';
import { useTimerTick } from '../../context/TimerContext.jsx';
import { formatHMS, msToMinutes, formatMinutes } from '../../utils/formatTime.js';

/**
 * The ONLY components that subscribe to the 1 Hz tick (§4.2 / §7.1).
 * Keeping them tiny means a second passing re-renders ~3 text nodes.
 */

export const LiveHMS = memo(function LiveHMS({ className = 'timer-display' }) {
  const ms = useTimerTick();
  return (
    <span className={className} aria-live="off">
      {formatHMS(ms)}
    </span>
  );
});

export const LiveCompact = memo(function LiveCompact({ className = 'ab-time' }) {
  const ms = useTimerTick();
  return <span className={className}>{formatHMS(ms)}</span>;
});

/** "+12m live" pill shown on the running subject card. */
export const LiveMinutes = memo(function LiveMinutes() {
  const ms = useTimerTick();
  const mins = msToMinutes(ms);
  return (
    <span className="chip" style={{ background: 'var(--success-soft)', color: 'var(--success)', borderColor: 'transparent' }}>
      <span className="pulse-dot" aria-hidden="true" />
      +{formatMinutes(mins)} live
    </span>
  );
});

