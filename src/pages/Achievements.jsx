import { useMemo } from 'react';
import { Trophy, Lock } from 'lucide-react';
import { useStudy } from '../context/StudyContext.jsx';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { buildAchievementStates } from '../utils/achievementsEngine.js';
import { METRIC_LABEL } from '../data/achievementsCatalog.js';
import { formatShortDate } from '../utils/dateUtils.js';
import Card from '../components/common/Card.jsx';
import ProgressBar from '../components/common/ProgressBar.jsx';

const fmtValue = (metric, value) =>
  metric === 'totalMinutes' || metric === 'bestDayMinutes'
    ? `${Math.floor(value / 60)}h`
    : String(value);

const fmtGoal = (metric, goal) =>
  metric === 'totalMinutes' || metric === 'bestDayMinutes'
    ? `${Math.floor(goal / 60)}h`
    : String(goal);

export default function Achievements() {
  useDocumentMeta(
    'Achievements',
    'Unlock milestones for study hours, perfect days, streaks and DSA problems solved.',
  );

  const state = useStudy();
  const { items, unlockedCount, total, next } = useMemo(
    () => buildAchievementStates(state),
    [state],
  );

  const groups = useMemo(() => {
    const map = new Map();
    items.forEach((i) => {
      if (!map.has(i.group)) map.set(i.group, []);
      map.get(i.group).push(i);
    });
    return [...map.entries()];
  }, [items]);

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Achievements</h1>
          <p className="page-sub">
            <strong className="tnum">
              {unlockedCount} / {total}
            </strong>{' '}
            unlocked
          </p>
        </div>
      </header>

      <Card>
        <div className="row-between" style={{ marginBottom: 'var(--sp-3)' }}>
          <span className="card-title">
            <Trophy size={18} aria-hidden="true" /> Collection progress
          </span>
          <span className="chip is-active tnum">
            {Math.round((unlockedCount / total) * 100)}%
          </span>
        </div>
        <ProgressBar
          percent={(unlockedCount / total) * 100}
          size="lg"
          label={`${unlockedCount} of ${total} achievements unlocked`}
        />
        {next ? (
          <p className="small muted" style={{ marginTop: 'var(--sp-3)' }}>
            Next up: <strong style={{ color: 'var(--text)' }}>{next.emoji} {next.name}</strong> —{' '}
            {fmtValue(next.metric, next.value)} of {fmtGoal(next.metric, next.goal)}{' '}
            {METRIC_LABEL[next.metric]} ({Math.round(next.percent)}%).
          </p>
        ) : (
          <p className="small" style={{ marginTop: 'var(--sp-3)', color: 'var(--success)' }}>
            Every achievement unlocked. Outstanding work.
          </p>
        )}
      </Card>

      {groups.map(([group, list]) => (
        <section className="section" key={group} aria-labelledby={`g-${group}`}>
          <div className="section-head">
            <h2 id={`g-${group}`}>{group}</h2>
            <span className="small muted">
              {list.filter((i) => i.unlocked).length}/{list.length}
            </span>
          </div>

          <div className="ach-grid">
            {list.map((a) => (
              <article className="ach-card" data-locked={!a.unlocked} key={a.id}>
                <span className="ach-emoji" aria-hidden="true">
                  {a.unlocked ? a.emoji : <Lock size={22} />}
                </span>
                <h3 className="ach-name">{a.name}</h3>
                <p className="ach-desc">{a.description}</p>

                {a.unlocked ? (
                  <span className="badge badge-success" style={{ marginTop: 'auto' }}>
                    Unlocked {formatShortDate(a.unlockedAt)}
                  </span>
                ) : (
                  <div className="ach-progress">
                    <ProgressBar
                      percent={a.percent}
                      size="sm"
                      label={`${a.name}: ${Math.round(a.percent)}% progress`}
                    />
                    <p className="xsmall muted" style={{ marginTop: 6 }}>
                      {fmtValue(a.metric, a.value)} / {fmtGoal(a.metric, a.goal)}{' '}
                      {METRIC_LABEL[a.metric]}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
