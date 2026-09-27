import { memo } from 'react';
import { CalendarDays, CheckCircle2 } from 'lucide-react';
import { useDayDetail } from '../../hooks/useStudyProgress.js';
import { useStudy } from '../../context/StudyContext.jsx';
import { formatMinutes } from '../../utils/formatTime.js';
import { formatLongDate } from '../../utils/dateUtils.js';
import ProgressBar from '../common/ProgressBar.jsx';
import Card from '../common/Card.jsx';
import EmptyState from '../common/EmptyState.jsx';
import SessionList from '../Dashboard/SessionList.jsx';

/** Shared day detail for the calendar grid and the heatmap (§10.11). */
function DayDetailPanel({ dateKey }) {
  const detail = useDayDetail(dateKey);
  const { subjects } = useStudy();

  if (!dateKey || !detail) {
    return (
      <Card title="Day details" icon={CalendarDays}>
        <EmptyState
          compact
          icon={CalendarDays}
          title="Pick a day"
          message="Select any day in the calendar or heatmap to see exactly what you studied."
        />
      </Card>
    );
  }

  return (
    <Card title={formatLongDate(dateKey)} icon={CalendarDays}>
      <div className="row-between" style={{ marginBottom: 'var(--sp-2)' }}>
        <span className="small muted">
          <strong className="tnum" style={{ color: 'var(--text)', fontSize: 'var(--fs-18)' }}>
            {formatMinutes(detail.completed)}
          </strong>{' '}
          of {formatMinutes(detail.target)}
        </span>
        <span className="chip is-active tnum">{detail.percentInt}%</span>
      </div>
      <ProgressBar percent={detail.percent} size="lg" label={`Progress on ${dateKey}`} />

      <dl className="subject-meta" style={{ marginTop: 'var(--sp-4)' }}>
        <div>
          <dt className="sm-label">Target</dt>
          <dd className="sm-value">{formatMinutes(detail.target)}</dd>
        </div>
        <div>
          <dt className="sm-label">Completed</dt>
          <dd className="sm-value" style={{ color: 'var(--success)' }}>
            {formatMinutes(detail.completed)}
          </dd>
        </div>
        <div>
          <dt className="sm-label">Remaining</dt>
          <dd className="sm-value" style={{ color: 'var(--accent)' }}>
            {formatMinutes(detail.remaining)}
          </dd>
        </div>
      </dl>

      <h3 style={{ fontSize: 'var(--fs-14)', margin: 'var(--sp-4) 0 var(--sp-2)' }}>
        Subjects studied
      </h3>
      {detail.bySubject.length === 0 ? (
        <p className="small muted">No study time recorded on this day.</p>
      ) : (
        <ul className="list-reset card-rows">
          {detail.bySubject.map((s) => (
            <li key={s.id} className="mini-row">
              <span
                aria-hidden="true"
                style={{
                  width: 8, height: 24, borderRadius: 'var(--r-full)', flex: '0 0 8px',
                  background: `var(--${s.colorKey})`,
                }}
              />
              <span className="grow truncate">{s.name}</span>
              <span className="chip tnum">{formatMinutes(s.minutes)}</span>
            </li>
          ))}
        </ul>
      )}

      <h3 style={{ fontSize: 'var(--fs-14)', margin: 'var(--sp-4) 0 var(--sp-2)' }}>
        Sessions ({detail.sessions.length})
      </h3>
      {detail.sessions.length === 0 ? (
        <p className="small muted">No sessions logged.</p>
      ) : (
        <SessionList sessions={detail.sessions} subjects={subjects} />
      )}

      <h3 style={{ fontSize: 'var(--fs-14)', margin: 'var(--sp-4) 0 var(--sp-2)' }}>
        Tasks completed ({detail.tasksDone.length})
      </h3>
      {detail.tasksDone.length === 0 ? (
        <p className="small muted">No tasks ticked off on this day.</p>
      ) : (
        <ul className="list-reset" style={{ display: 'grid', gap: 4 }}>
          {detail.tasksDone.map((t) => (
            <li key={t.id} className="row small" style={{ gap: 8 }}>
              <CheckCircle2 size={14} style={{ color: 'var(--success)', flex: '0 0 14px' }} aria-hidden="true" />
              <span className="truncate">{t.title}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default memo(DayDetailPanel);
