import { memo } from 'react';
import CircularProgress from '../common/CircularProgress.jsx';
import ProgressBar from '../common/ProgressBar.jsx';
import { formatMinutes } from '../../utils/formatTime.js';
import { useCountUp } from '../../hooks/useCountUp.js';

/** Hero progress block: large gradient bar + ring (§10.2.4). */
function DailyProgress({ progress }) {
  const { completed, target, remaining, percent, percentInt, isOver, overBy } = progress;
  const animatedPct = useCountUp(percent);

  return (
    <section className="card card-pad-lg" aria-label="Today's overall progress">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) auto',
          gap: 'var(--sp-6)',
          alignItems: 'center',
        }}
        className="daily-progress-grid"
      >
        <div>
          <div className="row-between" style={{ marginBottom: 'var(--sp-3)' }}>
            <h2 style={{ fontSize: 'var(--fs-18)' }}>Daily Progress</h2>
            <span className="chip is-active tnum">{percentInt}%</span>
          </div>

          <p style={{ fontSize: 'var(--fs-24)', fontWeight: 750, letterSpacing: '-0.02em' }} className="tnum">
            {formatMinutes(completed)}{' '}
            <span className="muted" style={{ fontSize: 'var(--fs-16)', fontWeight: 600 }}>
              / {formatMinutes(target)}
            </span>
          </p>

          <div style={{ marginTop: 'var(--sp-3)' }}>
            <ProgressBar
              percent={percent}
              size="lg"
              label={`Daily study progress: ${percentInt}% of ${formatMinutes(target)}`}
            />
          </div>

          <dl className="subject-meta" style={{ marginTop: 'var(--sp-4)' }}>
            <div>
              <dt className="sm-label">Target</dt>
              <dd className="sm-value">{formatMinutes(target)}</dd>
            </div>
            <div>
              <dt className="sm-label">Completed</dt>
              <dd className="sm-value" style={{ color: 'var(--success)' }}>
                {formatMinutes(completed)}
              </dd>
            </div>
            <div>
              <dt className="sm-label">Remaining</dt>
              <dd className="sm-value" style={{ color: 'var(--accent)' }}>
                {formatMinutes(remaining)}
              </dd>
            </div>
          </dl>

          {isOver ? (
            <p className="small" style={{ color: 'var(--success)', marginTop: 'var(--sp-3)' }}>
              Target smashed — {formatMinutes(overBy)} over the 16-hour goal.
            </p>
          ) : null}
        </div>

        <div style={{ display: 'grid', placeItems: 'center' }}>
          <CircularProgress
            percent={animatedPct}
            size={176}
            stroke={14}
            label={`${percentInt} percent of today's target completed`}
          >
            <div>
              <div style={{ fontSize: 'var(--fs-30)', fontWeight: 750 }} className="tnum">
                {Math.round(animatedPct)}%
              </div>
              <div className="xsmall muted">of {formatMinutes(target)}</div>
            </div>
          </CircularProgress>
        </div>
      </div>
    </section>
  );
}

export default memo(DailyProgress);
