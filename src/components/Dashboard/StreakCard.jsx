import { memo } from 'react';
import { Flame } from 'lucide-react';
import { formatMinutes } from '../../utils/formatTime.js';

/** Streak tile with the "today pending" nudge from §9.4. */
function StreakCard({ streak }) {
  const { currentStreak, longestStreak, todayPending, minutesToKeepStreak, todayQualified } = streak;

  return (
    <article className="stat-card" data-tone="accent">
      <div className="row-between">
        <span className="stat-label">Streak</span>
        <span className="stat-icon" aria-hidden="true">
          <Flame size={19} />
        </span>
      </div>
      <div className="stat-value">
        {currentStreak} <span style={{ fontSize: 'var(--fs-16)', fontWeight: 600 }}>
          {currentStreak === 1 ? 'day' : 'days'}
        </span>{' '}
        <span aria-hidden="true">🔥</span>
      </div>
      <div className="stat-sub">
        {todayQualified
          ? `Secured today · best ${longestStreak}`
          : todayPending
            ? `Today pending — ${formatMinutes(minutesToKeepStreak)} to keep the streak`
            : minutesToKeepStreak > 0
              ? `${formatMinutes(minutesToKeepStreak)} today starts a new streak`
              : `Best streak: ${longestStreak}`}
      </div>
    </article>
  );
}

export default memo(StreakCard);
