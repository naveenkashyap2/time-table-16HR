import { memo, useCallback } from 'react';
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProgressBar from '../common/ProgressBar.jsx';
import Button from '../common/Button.jsx';
import TimerControls from '../Timer/TimerControls.jsx';
import { LiveMinutes } from '../Timer/LiveElapsed.jsx';
import { getIcon } from '../../data/icons.js';
import { formatMinutes } from '../../utils/formatTime.js';

/**
 * Subject tile (§10.2.5): icon, name, target / completed / remaining, %,
 * mini bar, live timer controls, "Complete" quick action and a task preview.
 */
function SubjectCard({
  subject,
  progress,
  isRunning,
  isActive,
  tasks = [],
  doneTaskIds,
  onToggleTask,
  onComplete,
}) {
  const Icon = getIcon(subject.iconKey);
  const { completed, target, remaining, percent, percentInt, isComplete } = progress;

  const handleComplete = useCallback(() => onComplete(subject), [onComplete, subject]);

  const previewTasks = tasks.slice(0, 2);

  return (
    <article className="subject-card" data-running={isRunning} data-complete={isComplete}>
      <header className="row" style={{ gap: 'var(--sp-3)' }}>
        <span className={`subject-icon tone-${subject.colorKey || 'primary'}`} aria-hidden="true">
          <Icon size={21} />
        </span>
        <div className="grow" style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: 'var(--fs-16)' }} className="truncate">
            {subject.name}
          </h3>
          <p className="xsmall muted">Target {formatMinutes(target)}</p>
        </div>
        {isActive ? <LiveMinutes /> : null}
        {isComplete && !isActive ? (
          <span className="badge badge-success">
            <CheckCircle2 size={13} aria-hidden="true" /> Done
          </span>
        ) : null}
      </header>

      <div>
        <div className="row-between xsmall muted" style={{ marginBottom: 6 }}>
          <span>Progress</span>
          <span className="tnum" style={{ fontWeight: 700, color: 'var(--text)' }}>
            {percentInt}%
          </span>
        </div>
        <ProgressBar percent={percent} label={`${subject.name} progress: ${percentInt}%`} />
      </div>

      <dl className="subject-meta">
        <div>
          <dt className="sm-label">Target</dt>
          <dd className="sm-value">{formatMinutes(target)}</dd>
        </div>
        <div>
          <dt className="sm-label">Done</dt>
          <dd className="sm-value" style={{ color: 'var(--success)' }}>
            {formatMinutes(completed)}
          </dd>
        </div>
        <div>
          <dt className="sm-label">Left</dt>
          <dd className="sm-value" style={{ color: 'var(--accent)' }}>
            {formatMinutes(remaining)}
          </dd>
        </div>
      </dl>

      {subject.subBlocks?.length ? (
        <ul className="subblock-list list-reset">
          {subject.subBlocks.map((b) => (
            <li key={b.name}>
              <span className="truncate">{b.name}</span>
              <span className="tnum">{formatMinutes(b.targetMinutes)}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {previewTasks.length ? (
        <ul className="list-reset" style={{ display: 'grid', gap: 4 }}>
          {previewTasks.map((t) => {
            const done = doneTaskIds.has(t.id);
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onToggleTask(t.id)}
                  className="row"
                  aria-pressed={done}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px 0',
                    width: '100%',
                    textAlign: 'left',
                    gap: 8,
                    color: done ? 'var(--muted)' : 'var(--text)',
                  }}
                >
                  {done ? (
                    <CheckCircle2 size={15} style={{ color: 'var(--success)', flex: '0 0 15px' }} aria-hidden="true" />
                  ) : (
                    <Circle size={15} style={{ flex: '0 0 15px', opacity: 0.6 }} aria-hidden="true" />
                  )}
                  <span
                    className="xsmall truncate"
                    style={{ textDecoration: done ? 'line-through' : 'none' }}
                  >
                    {t.title}
                  </span>
                </button>
              </li>
            );
          })}
          {tasks.length > 2 ? (
            <li>
              <Link to="/tasks" className="xsmall muted row" style={{ gap: 4, textDecoration: 'none' }}>
                +{tasks.length - 2} more <ChevronRight size={12} aria-hidden="true" />
              </Link>
            </li>
          ) : null}
        </ul>
      ) : null}

      <div className="row wrap" style={{ marginTop: 'auto', gap: 'var(--sp-2)' }}>
        <TimerControls subjectId={subject.id} size="sm" />
        {!isComplete ? (
          <Button
            size="sm"
            variant="ghost"
            icon={CheckCircle2}
            onClick={handleComplete}
            title={`Log the remaining ${formatMinutes(remaining)} as completed`}
          >
            Complete
          </Button>
        ) : null}
      </div>
    </article>
  );
}

export default memo(SubjectCard);
