import { useTimerActions, useTimerState } from '../../context/TimerContext.jsx';
import { useStudy } from '../../context/StudyContext.jsx';
import ConfirmDialog from '../common/ConfirmDialog.jsx';

/**
 * One-timer rule (§9.2). Starting a second timer asks first; confirming
 * auto-stops (and saves) the running one, then starts the new subject.
 */
export default function TimerSwitchModal() {
  const { pendingSwitch } = useTimerState();
  const { confirmSwitch, cancelSwitch } = useTimerActions();
  const { subjects } = useStudy();

  const nameOf = (id) => subjects.find((s) => s.id === id)?.name || 'this subject';
  const open = Boolean(pendingSwitch);

  return (
    <ConfirmDialog
      open={open}
      onCancel={cancelSwitch}
      onConfirm={confirmSwitch}
      title="A timer is already running"
      confirmLabel="Stop and switch"
      cancelLabel="Keep current"
      message={
        open
          ? `Another timer is already running. Stop the current timer and start ${nameOf(
              pendingSwitch.subjectId,
            )}?`
          : ''
      }
    >
      {open ? (
        <p className="small muted">
          The {nameOf(pendingSwitch.fromSubjectId)} session will be saved to today&rsquo;s log
          before the new one starts.
        </p>
      ) : null}
    </ConfirmDialog>
  );
}
