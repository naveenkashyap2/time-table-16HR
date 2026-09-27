import { Play } from 'lucide-react';
import { useStudy } from '../../context/StudyContext.jsx';
import { useTimerActions, useTimerState } from '../../context/TimerContext.jsx';
import { useAllSubjectProgress } from '../../hooks/useStudyProgress.js';
import { useDocumentMeta } from '../../hooks/useDocumentMeta.js';
import { formatMinutes } from '../../utils/formatTime.js';
import { getIcon } from '../../data/icons.js';
import TopicTracker from './TopicTracker.jsx';
import Button from '../common/Button.jsx';
import ProgressBar from '../common/ProgressBar.jsx';

/**
 * Shared shell for /system-design, /dotnet and /react-native (§10.9).
 * Each carries its linked subject's daily target card, wired to the timer.
 */
export default function TrackerPage({ title, description, tracker, slice, subjectSlug }) {
  useDocumentMeta(title, description);

  const { subjects } = useStudy();
  const { start } = useTimerActions();
  const { activeSubjectId } = useTimerState();
  const progressMap = useAllSubjectProgress();

  const subject = subjects.find((s) => s.slug === subjectSlug) || null;
  const p = subject ? progressMap[subject.id] : null;
  const Icon = subject ? getIcon(subject.iconKey) : null;

  return (
    <>
      <header className="page-head">
        <div>
          <h1>{title}</h1>
          <p className="page-sub">{description}</p>
        </div>
      </header>

      {subject && p ? (
        <section className="card" aria-label={`${subject.name} daily target`}>
          <div className="row wrap" style={{ gap: 'var(--sp-4)' }}>
            <span className={`subject-icon tone-${subject.colorKey}`} aria-hidden="true">
              <Icon size={21} />
            </span>
            <div className="grow" style={{ minWidth: 200 }}>
              <div className="row-between">
                <h2 style={{ fontSize: 'var(--fs-16)' }}>{subject.name} — daily target</h2>
                <span className="chip is-active tnum">{p.percentInt}%</span>
              </div>
              <p className="xsmall muted" style={{ marginBottom: 8 }}>
                {formatMinutes(p.completed)} of {formatMinutes(p.target)} done today ·{' '}
                {formatMinutes(p.remaining)} left
              </p>
              <ProgressBar percent={p.percent} label={`${subject.name} today`} />
            </div>
            <Button
              variant={activeSubjectId === subject.id ? 'secondary' : 'primary'}
              icon={Play}
              onClick={() => start(subject.id)}
              disabled={activeSubjectId === subject.id}
            >
              {activeSubjectId === subject.id ? 'Timer active' : 'Start session'}
            </Button>
          </div>
        </section>
      ) : null}

      <div className="section">
        <TopicTracker tracker={tracker} slice={slice} />
      </div>
    </>
  );
}
