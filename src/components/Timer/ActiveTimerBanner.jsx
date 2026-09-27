import { memo } from 'react';
import { Pause, Play, Square } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTimerActions, useTimerState } from '../../context/TimerContext.jsx';
import { useStudy } from '../../context/StudyContext.jsx';
import { LiveCompact } from './LiveElapsed.jsx';
import Button from '../common/Button.jsx';

/**
 * Persistent active-timer bar (§10.2.7) — rendered by AppLayout so it is
 * visible on EVERY page. Only <LiveCompact> subscribes to the 1 Hz tick.
 */
function ActiveTimerBanner() {
  const { hasSession, isRunning, activeSubjectId } = useTimerState();
  const { pause, resume, stop } = useTimerActions();
  const { subjects } = useStudy();

  if (!hasSession) return null;

  const subject = subjects.find((s) => s.id === activeSubjectId);

  return (
    <div className="active-banner" role="region" aria-label="Active study session">
      <span className="pulse-dot" aria-hidden="true" style={{ background: '#fff' }} />
      <div className="grow" style={{ minWidth: 0 }}>
        <div className="xsmall" style={{ opacity: 0.85 }}>
          {isRunning ? 'Studying now' : 'Paused'}
        </div>
        <Link
          to="/timer"
          className="truncate"
          style={{ color: '#fff', fontWeight: 650, textDecoration: 'none', display: 'block' }}
        >
          {subject?.name || 'Unknown subject'}
        </Link>
      </div>
      <LiveCompact />
      {isRunning ? (
        <Button size="sm" icon={Pause} onClick={pause} aria-label="Pause session">
          Pause
        </Button>
      ) : (
        <Button size="sm" icon={Play} onClick={resume} aria-label="Resume session">
          Resume
        </Button>
      )}
      <Button size="sm" icon={Square} onClick={() => stop()} aria-label="Stop and save session">
        Stop
      </Button>
    </div>
  );
}

export default memo(ActiveTimerBanner);
