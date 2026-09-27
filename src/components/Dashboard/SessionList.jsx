import { memo } from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { formatDurationMs } from '../../utils/formatTime.js';
import { formatClockTime, formatShortDate, todayKey } from '../../utils/dateUtils.js';
import Button from '../common/Button.jsx';

/** Reusable session log row list (dashboard + timer page + calendar detail). */
function SessionList({ sessions, subjects, onDelete, showDate = false }) {
  const nameOf = (id) => subjects.find((s) => s.id === id)?.name || 'Deleted subject';
  const colorOf = (id) => subjects.find((s) => s.id === id)?.colorKey || 'primary';

  return (
    <ul className="list-reset card-rows">
      {sessions.map((s) => (
        <li key={s.id} className="mini-row">
          <span
            aria-hidden="true"
            style={{
              width: 8,
              height: 32,
              borderRadius: 'var(--r-full)',
              flex: '0 0 8px',
              background: `var(--${colorOf(s.subjectId)})`,
            }}
          />
          <div className="grow" style={{ minWidth: 0 }}>
            <div className="truncate" style={{ fontWeight: 600 }}>
              {nameOf(s.subjectId)}
            </div>
            <div className="xsmall muted row" style={{ gap: 6 }}>
              <Clock size={12} aria-hidden="true" />
              <span className="tnum">
                {formatClockTime(s.startAt)} – {formatClockTime(s.endAt)}
              </span>
              {showDate && s.dateKey !== todayKey() ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{formatShortDate(s.dateKey)}</span>
                </>
              ) : null}
              {s.source === 'manual' ? <span className="badge badge-neutral">manual</span> : null}
            </div>
          </div>
          <span className="chip tnum">{formatDurationMs(s.durationMs)}</span>
          {onDelete ? (
            <Button
              size="sm"
              variant="ghost"
              iconOnly
              icon={Trash2}
              onClick={() => onDelete(s)}
              aria-label={`Delete ${nameOf(s.subjectId)} session`}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export default memo(SessionList);
