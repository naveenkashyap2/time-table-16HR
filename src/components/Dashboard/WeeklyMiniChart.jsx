import { memo } from 'react';
import { formatMinutes, toHours } from '../../utils/formatTime.js';

/**
 * 7-bar weekly chart built from real DayRecords.
 * Deliberately CSS-only: recharts must NEVER enter the dashboard chunk (§4.1).
 */
function WeeklyMiniChart({ days, target }) {
  const max = Math.max(target, ...days.map((d) => d.minutes), 1);

  return (
    <div>
      <div className="minichart" role="img" aria-label="Study hours for each day this week">
        {days.map((d) => {
          const pct = Math.min(100, (d.minutes / max) * 100);
          return (
            <div className="minichart-col" key={d.dateKey}>
              <span className="xsmall tnum muted" style={{ fontWeight: 700 }}>
                {d.minutes > 0 ? `${toHours(d.minutes)}` : '·'}
              </span>
              <div
                className="minichart-track"
                title={`${d.label}: ${formatMinutes(d.minutes)}`}
              >
                <div
                  className="minichart-bar"
                  data-today={d.isToday}
                  style={{ height: `${pct}%` }}
                />
              </div>
              <span
                className="minichart-label"
                style={d.isToday ? { color: 'var(--primary)', fontWeight: 800 } : undefined}
              >
                {d.shortLabel}
              </span>
            </div>
          );
        })}
      </div>
      <ul className="sr-only">
        {days.map((d) => (
          <li key={d.dateKey}>
            {d.label}: {formatMinutes(d.minutes)} of {formatMinutes(d.target)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default memo(WeeklyMiniChart);
