import { memo } from 'react';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';
import Button from '../common/Button.jsx';
import { useTimerActions, useTimerState } from '../../context/TimerContext.jsx';

/**
 * Start / Pause / Resume / Stop / Reset.
 * All targets are >= 44px via .btn (§10.4 / §12.1).
 */
function TimerControls({ subjectId, size = 'md', showReset = false, compact = false }) {
  const { start, pause, resume, stop, reset } = useTimerActions();
  const { activeSubjectId, isRunning, hasSession } = useTimerState();

  const isThis = hasSession && activeSubjectId === subjectId;
  const runningThis = isThis && isRunning;
  const pausedThis = isThis && !isRunning;

  return (
    <div className="row wrap" style={{ gap: 'var(--sp-2)' }}>
      {!isThis ? (
        <Button
          variant="primary"
          size={size}
          icon={Play}
          onClick={() => start(subjectId)}
          aria-label="Start timer"
        >
          Start
        </Button>
      ) : null}

      {runningThis ? (
        <Button variant="secondary" size={size} icon={Pause} onClick={pause} aria-label="Pause timer">
          Pause
        </Button>
      ) : null}

      {pausedThis ? (
        <Button variant="primary" size={size} icon={Play} onClick={resume} aria-label="Resume timer">
          Resume
        </Button>
      ) : null}

      {isThis ? (
        <Button variant="danger" size={size} icon={Square} onClick={() => stop()} aria-label="Stop and save session">
          Stop
        </Button>
      ) : null}

      {isThis && showReset ? (
        <Button
          variant="ghost"
          size={size}
          icon={RotateCcw}
          onClick={reset}
          aria-label="Discard this session without saving"
          title="Discard without saving"
        >
          Reset
        </Button>
      ) : null}
    </div>
  );
}

export default memo(TimerControls);
