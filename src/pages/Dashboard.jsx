import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Target, CheckCircle2, Hourglass, TrendingUp, ArrowRight, History, CalendarRange, PlayCircle,
} from 'lucide-react';
import { useStudy, useStudyActions } from '../context/StudyContext.jsx';
import { useTimerState } from '../context/TimerContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  useTodayProgress, useAllSubjectProgress, useWeekStats, useRecentSessions, useTaskStats,
} from '../hooks/useStudyProgress.js';
import { useStreak } from '../hooks/useStreak.js';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { formatLongDate, greetingFor, todayKey } from '../utils/dateUtils.js';
import { formatMinutes, minutesToMs } from '../utils/formatTime.js';
import { uid } from '../utils/id.js';

import ProgressCard from '../components/Dashboard/ProgressCard.jsx';
import StreakCard from '../components/Dashboard/StreakCard.jsx';
import QuoteCard from '../components/Dashboard/QuoteCard.jsx';
import DailyProgress from '../components/Dashboard/DailyProgress.jsx';
import SubjectCard from '../components/Dashboard/SubjectCard.jsx';
import WeeklyMiniChart from '../components/Dashboard/WeeklyMiniChart.jsx';
import SessionList from '../components/Dashboard/SessionList.jsx';
import LiveClock from '../components/Layout/LiveClock.jsx';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import TaskList from '../components/Tasks/TaskList.jsx';

export default function Dashboard() {
  useDocumentMeta(
    'Dashboard',
    "Your 16-hour study dashboard: today's target, completed hours, subject progress, streak and recent sessions.",
  );

  const { subjects, tasks, settings } = useStudy();
  const { toggleTaskToday, appendSession } = useStudyActions();
  const { activeSubjectId, isRunning } = useTimerState();
  const toast = useToast();

  const progress = useTodayProgress();
  const subjectProgress = useAllSubjectProgress();
  const week = useWeekStats(0);
  const streak = useStreak();
  const recent = useRecentSessions(5);
  const taskStats = useTaskStats();
  const tKey = todayKey();

  const [greeting] = useState(() => greetingFor());

  const orderedSubjects = useMemo(
    () => [...subjects].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [subjects],
  );

  const doneIds = useMemo(
    () => new Set(tasks.filter((t) => (t.doneDates || []).includes(tKey)).map((t) => t.id)),
    [tasks, tKey],
  );

  const tasksBySubject = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      (map[t.subjectId] ||= []).push(t);
    });
    return map;
  }, [tasks]);

  const previewTasks = useMemo(() => tasks.slice(0, 6), [tasks]);

  const subjectNames = useMemo(
    () => Object.fromEntries(subjects.map((s) => [s.id, s.name])),
    [subjects],
  );

  /** "Complete" quick action — logs the remaining minutes as a manual session. */
  const completeSubject = useCallback(
    (subject) => {
      const p = subjectProgress[subject.id];
      const remaining = p?.remaining ?? 0;
      if (remaining <= 0) return;
      const now = Date.now();
      const durationMs = minutesToMs(remaining);
      appendSession({
        id: uid('ses'),
        subjectId: subject.id,
        dateKey: tKey,
        startAt: now - durationMs,
        endAt: now,
        durationMs,
        source: 'manual',
      });
      toast.success('Subject completed', `${subject.name} — ${formatMinutes(remaining)} logged.`);
    },
    [subjectProgress, appendSession, tKey, toast],
  );

  const handleToggleTask = useCallback((id) => toggleTaskToday(id), [toggleTaskToday]);

  return (
    <>
      {/* 1 — Greeting header */}
      <header className="page-head">
        <div>
          <h1>
            {greeting}, {settings.userName || 'Naveen'} <span aria-hidden="true">👋</span>
          </h1>
          <p className="page-sub">{formatLongDate()}</p>
        </div>
        <div className="row wrap">
          <LiveClock withSeconds />
          <Button to="/timer" variant="primary" icon={PlayCircle}>
            Start studying
          </Button>
        </div>
      </header>

      {/* 2 — Daily quote */}
      <QuoteCard />

      {/* 3 — 16-hour target strip */}
      <section className="section" aria-label="Today's targets">
        <div className="stat-grid stat-grid-5">
          <ProgressCard
            label="Target"
            icon={Target}
            countTo={progress.target / 60}
            format={(n) => `${n.toFixed(n % 1 === 0 ? 0 : 1)}h`}
            sub="Daily study goal"
          />
          <ProgressCard
            label="Completed"
            icon={CheckCircle2}
            tone="success"
            countTo={progress.completed}
            format={(n) => formatMinutes(Math.round(n))}
            sub={`${progress.percentInt}% of target`}
          />
          <ProgressCard
            label="Remaining"
            icon={Hourglass}
            tone="accent"
            countTo={progress.remaining}
            format={(n) => formatMinutes(Math.round(n))}
            sub={progress.remaining === 0 ? 'Target reached 🎉' : 'Still to go today'}
          />
          <ProgressCard
            label="Progress"
            icon={TrendingUp}
            tone="secondary"
            countTo={progress.percent}
            format={(n) => `${Math.round(n)}%`}
            sub={`${taskStats.done}/${taskStats.total} tasks done`}
          />
          <StreakCard streak={streak} />
        </div>
      </section>

      {/* 4 — Main progress */}
      <section className="section">
        <DailyProgress progress={progress} />
      </section>

      {/* 5 — Subject cards */}
      <section className="section" aria-labelledby="subjects-heading">
        <div className="section-head">
          <h2 id="subjects-heading">Subjects</h2>
          <Button to="/plan" variant="ghost" size="sm" iconRight={ArrowRight}>
            Edit plan
          </Button>
        </div>

        {orderedSubjects.length === 0 ? (
          <Card>
            <EmptyState
              icon={Target}
              title="No subjects yet"
              message="Add the subjects you want to track and give each one a daily target."
              actionLabel="Set up my plan"
              actionTo="/plan"
            />
          </Card>
        ) : (
          <div className="subject-grid">
            {orderedSubjects.map((s) => (
              <SubjectCard
                key={s.id}
                subject={s}
                progress={subjectProgress[s.id]}
                isActive={activeSubjectId === s.id}
                isRunning={activeSubjectId === s.id && isRunning}
                tasks={tasksBySubject[s.id] || []}
                doneTaskIds={doneIds}
                onToggleTask={handleToggleTask}
                onComplete={completeSubject}
              />
            ))}
          </div>
        )}
      </section>

      {/* 6 + 8 — Tasks preview, weekly chart, recent sessions */}
      <section className="section two-col">
        <div className="stack">
          <Card
            title="Today's Tasks"
            action={
              <Link to="/tasks" className="small">
                View all
              </Link>
            }
          >
            <p className="small muted" style={{ marginBottom: 'var(--sp-3)' }}>
              {taskStats.done} of {taskStats.total} done today
            </p>
            <TaskList
              tasks={previewTasks}
              doneIds={doneIds}
              onToggle={handleToggleTask}
              onEdit={() => {}}
              onDelete={() => {}}
              subjectNames={subjectNames}
              emptyMessage="No tasks yet — add a few on the Tasks page."
            />
          </Card>

          <Card
            title="This Week"
            icon={CalendarRange}
            action={
              <Link to="/analytics" className="small">
                Analytics
              </Link>
            }
          >
            <WeeklyMiniChart days={week.days} target={settings.dailyTargetMinutes} />
            <div className="row-between small muted" style={{ marginTop: 'var(--sp-4)' }}>
              <span>
                Total <strong className="tnum" style={{ color: 'var(--text)' }}>{formatMinutes(week.completed)}</strong>
              </span>
              <span>
                Avg/day <strong className="tnum" style={{ color: 'var(--text)' }}>{formatMinutes(week.avgPerDay)}</strong>
              </span>
              <span>
                Best <strong className="tnum" style={{ color: 'var(--text)' }}>
                  {week.bestDay ? formatMinutes(week.bestDay.minutes) : '—'}
                </strong>
              </span>
            </div>
          </Card>
        </div>

        <Card
          title="Recent Sessions"
          icon={History}
          action={
            <Link to="/timer" className="small">
              Timer
            </Link>
          }
        >
          {recent.length === 0 ? (
            <EmptyState
              compact
              icon={History}
              title="No study sessions today"
              message="Start your first session to begin tracking."
              actionLabel="Open the timer"
              actionTo="/timer"
            />
          ) : (
            <SessionList sessions={recent} subjects={subjects} showDate />
          )}
        </Card>
      </section>
    </>
  );
}
