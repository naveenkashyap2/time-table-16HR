import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Timer as TimerIcon, History, Target } from 'lucide-react';
import { useStudy, useStudyActions } from '../context/StudyContext.jsx';
import { useTimerActions, useTimerState } from '../context/TimerContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAllSubjectProgress, useTodaySessions } from '../hooks/useStudyProgress.js';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { getIcon } from '../data/icons.js';
import { formatMinutes } from '../utils/formatTime.js';
import { LiveHMS } from '../components/Timer/LiveElapsed.jsx';
import TimerControls from '../components/Timer/TimerControls.jsx';
import CircularProgress from '../components/common/CircularProgress.jsx';
import Card from '../components/common/Card.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import SessionList from '../components/Dashboard/SessionList.jsx';
import ProgressBar from '../components/common/ProgressBar.jsx';

export default function Timer() {
  useDocumentMeta(
    'Study Timer',
    'A drift-free study timer that survives refreshes, tracks every subject and logs real session data.',
  );

  const { subjects } = useStudy();
  const { deleteSession } = useStudyActions();
  const { start, toggle, stop } = useTimerActions();
  const { activeSubjectId, isRunning, hasSession } = useTimerState();
  const progressMap = useAllSubjectProgress();
  const todaySessions = useTodaySessions();
  const toast = useToast();
  const stageRef = useRef(null);

  const ordered = useMemo(
    () => [...subjects].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [subjects],
  );

  const active = subjects.find((s) => s.id === activeSubjectId) || null;
  const activeProgress = active ? progressMap[active.id] : null;

  /* Keyboard: Space toggles start/pause while the timer region has focus. */
  useEffect(() => {
    const node = stageRef.current;
    if (!node) return undefined;
    const onKey = (e) => {
      if (e.code !== 'Space' && e.key !== ' ') return;
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return;
      e.preventDefault();
      if (hasSession) toggle();
      else if (ordered[0]) start(ordered[0].id);
    };
    node.addEventListener('keydown', onKey);
    return () => node.removeEventListener('keydown', onKey);
  }, [hasSession, toggle, start, ordered]);

  const onDeleteSession = useCallback(
    (session) => {
      deleteSession(session.id);
      toast.info('Session removed', 'Your daily totals were recalculated.');
    },
    [deleteSession, toast],
  );

  const ActiveIcon = active ? getIcon(active.iconKey) : TimerIcon;

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Study Timer</h1>
          <p className="page-sub">
            Timestamp-based and refresh-safe. Press <span className="kbd">Space</span> to start or
            pause, <span className="kbd">Esc</span> to close dialogs.
          </p>
        </div>
      </header>

      <Card padding="lg">
        <div
          className="timer-stage"
          ref={stageRef}
          tabIndex={0}
          role="group"
          aria-label="Study timer controls"
          style={{ outlineOffset: 8 }}
        >
          <div className="timer-ring-holder">
            <CircularProgress
              percent={activeProgress?.percent || 0}
              size={300}
              stroke={16}
              label={
                active
                  ? `${active.name} is ${activeProgress.percentInt}% of today's target`
                  : 'No subject selected'
              }
            >
              <div style={{ display: 'grid', gap: 6, justifyItems: 'center' }}>
                <span className="row xsmall muted" style={{ gap: 6 }}>
                  <ActiveIcon size={14} aria-hidden="true" />
                  {active ? active.name : 'Pick a subject'}
                </span>
                <LiveHMS />
                <span className="xsmall muted">
                  {hasSession
                    ? isRunning
                      ? 'Running'
                      : 'Paused'
                    : 'Ready when you are'}
                </span>
              </div>
            </CircularProgress>
          </div>

          {active ? (
            <div style={{ width: 'min(420px, 100%)' }}>
              <div className="row-between xsmall muted" style={{ marginBottom: 6 }}>
                <span>Today: {formatMinutes(activeProgress.completed)}</span>
                <span>Target: {formatMinutes(activeProgress.target)}</span>
              </div>
              <ProgressBar
                percent={activeProgress.percent}
                label={`${active.name} progress today`}
              />
            </div>
          ) : null}

          <div className="timer-controls">
            {active ? (
              <TimerControls subjectId={active.id} size="lg" showReset />
            ) : (
              <p className="muted small">Choose a subject below to begin.</p>
            )}
          </div>
        </div>
      </Card>

      {/* Subject selector chips */}
      <section className="section" aria-labelledby="pick-subject">
        <div className="section-head">
          <h2 id="pick-subject">
            <Target size={18} aria-hidden="true" /> Choose a subject
          </h2>
        </div>

        {ordered.length === 0 ? (
          <Card>
            <EmptyState
              icon={Target}
              title="No subjects to time"
              message="Add subjects to your plan first, then come back and start the clock."
              actionLabel="Set up my plan"
              actionTo="/plan"
            />
          </Card>
        ) : (
          <div className="row wrap">
            {ordered.map((s) => {
              const Icon = getIcon(s.iconKey);
              const p = progressMap[s.id];
              const isActive = s.id === activeSubjectId;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`chip chip-btn${isActive ? ' is-active' : ''}`}
                  onClick={() => start(s.id)}
                  aria-pressed={isActive}
                  style={{ padding: '10px 14px', minHeight: 44 }}
                >
                  <Icon size={15} aria-hidden="true" />
                  {s.name}
                  <span className="tnum" style={{ opacity: 0.75 }}>
                    {p.percentInt}%
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Today's sessions */}
      <section className="section">
        <Card title="Today's sessions" icon={History}>
          {todaySessions.length === 0 ? (
            <EmptyState
              compact
              icon={History}
              title="No study sessions today"
              message="Start your first session to begin tracking."
            />
          ) : (
            <>
              <p className="small muted" style={{ marginBottom: 'var(--sp-3)' }}>
                {todaySessions.length} session{todaySessions.length === 1 ? '' : 's'} logged today.
              </p>
              <SessionList
                sessions={todaySessions}
                subjects={subjects}
                onDelete={onDeleteSession}
              />
            </>
          )}
        </Card>
      </section>
    </>
  );
}
