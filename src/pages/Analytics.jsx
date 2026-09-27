import { Suspense, lazy, useState } from 'react';
import {
  ChevronLeft, ChevronRight, Clock, TrendingUp, Award, Hourglass, Target,
  CalendarRange, Layers, Timer as TimerIcon,
} from 'lucide-react';
import { useWeekStats, useMonthStats } from '../hooks/useStudyProgress.js';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { formatMinutes } from '../utils/formatTime.js';
import { useStudy } from '../context/StudyContext.jsx';
import StatGrid from '../components/Analytics/StatGrid.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import ProgressBar from '../components/common/ProgressBar.jsx';

/* recharts lives ONLY behind these dynamic imports (§4.1). */
const WeeklyChart = lazy(() => import('../components/Analytics/WeeklyChart.jsx'));
const MonthlyChart = lazy(() => import('../components/Analytics/MonthlyChart.jsx'));

function ChartSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading charts…</span>
      <div className="skel skel-chart" style={{ marginBottom: 'var(--sp-6)' }} />
      <div className="two-col">
        <div className="skel skel-chart" />
        <div className="skel skel-chart" />
      </div>
    </div>
  );
}

export default function Analytics() {
  useDocumentMeta(
    'Analytics',
    'Weekly and monthly study analytics built from your real session data: hours, subject split, trends and consistency.',
  );

  const [tab, setTab] = useState('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const { subjects } = useStudy();

  const week = useWeekStats(weekOffset);
  const month = useMonthStats(monthOffset);

  const nameOf = (id) => subjects.find((s) => s.id === id)?.name || '—';

  const weekItems = [
    { label: 'Total hours', value: formatMinutes(week.completed), sub: `${week.percentInt}% of target`, icon: Clock },
    { label: 'Weekly target', value: formatMinutes(week.target), sub: '7 × daily target', icon: Target, tone: 'muted' },
    { label: 'Remaining', value: formatMinutes(week.remaining), sub: 'to hit the weekly goal', icon: Hourglass, tone: 'accent' },
    { label: 'Average / day', value: formatMinutes(week.avgPerDay), sub: `${week.sessionCount} sessions`, icon: TrendingUp, tone: 'secondary' },
    { label: 'Best day', value: week.bestDay ? formatMinutes(week.bestDay.minutes) : '—', sub: week.bestDay ? week.bestDay.label : 'no data yet', icon: Award, tone: 'success' },
    { label: 'Lowest day', value: week.lowestDay ? formatMinutes(week.lowestDay.minutes) : '—', sub: week.lowestDay ? week.lowestDay.label : 'no data yet', icon: TrendingUp, tone: 'muted' },
  ];

  const monthItems = [
    { label: 'Total hours', value: formatMinutes(month.completed), sub: `${month.percentInt}% of target`, icon: Clock },
    { label: 'Monthly target', value: formatMinutes(month.target), sub: `${month.daysInMonth} × daily target`, icon: Target, tone: 'muted' },
    { label: 'Remaining', value: formatMinutes(month.remaining), sub: 'to hit the monthly goal', icon: Hourglass, tone: 'accent' },
    { label: 'Average / day', value: formatMinutes(month.avgPerDay), sub: `${month.studiedDays} active days`, icon: TrendingUp, tone: 'secondary' },
    { label: 'Sessions', value: String(month.sessionCount), sub: 'logged this month', icon: TimerIcon },
    { label: 'Longest session', value: formatMinutes(month.longestSessionMinutes), sub: month.longestSessionSubjectId ? nameOf(month.longestSessionSubjectId) : '—', icon: Award, tone: 'success' },
    { label: 'Most studied', value: month.mostStudied ? month.mostStudied.name : '—', sub: month.mostStudied ? formatMinutes(month.mostStudied.minutes) : 'no data yet', icon: Layers, tone: 'secondary' },
    { label: 'Active days', value: `${month.studiedDays}/${month.daysInMonth}`, sub: 'days with study time', icon: CalendarRange },
  ];

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Analytics</h1>
          <p className="page-sub">Everything here is computed from your real sessions.</p>
        </div>
        <div
          className="tabs"
          role="tablist"
          aria-label="Analytics period"
        >
          <button
            type="button"
            role="tab"
            className="tab"
            aria-selected={tab === 'week'}
            aria-controls="panel-week"
            id="tab-week"
            onClick={() => setTab('week')}
          >
            Week
          </button>
          <button
            type="button"
            role="tab"
            className="tab"
            aria-selected={tab === 'month'}
            aria-controls="panel-month"
            id="tab-month"
            onClick={() => setTab('month')}
          >
            Month
          </button>
        </div>
      </header>

      {tab === 'week' ? (
        <div id="panel-week" role="tabpanel" aria-labelledby="tab-week">
          <div className="row-between wrap" style={{ marginBottom: 'var(--sp-4)' }}>
            <h2 style={{ fontSize: 'var(--fs-18)' }}>{week.label}</h2>
            <div className="row">
              <Button size="sm" variant="ghost" iconOnly icon={ChevronLeft}
                onClick={() => setWeekOffset((o) => o - 1)} aria-label="Previous week" />
              <Button size="sm" variant="ghost" onClick={() => setWeekOffset(0)} disabled={weekOffset === 0}>
                This week
              </Button>
              <Button size="sm" variant="ghost" iconOnly icon={ChevronRight}
                onClick={() => setWeekOffset((o) => Math.min(0, o + 1))}
                disabled={weekOffset >= 0} aria-label="Next week" />
            </div>
          </div>

          <StatGrid items={weekItems} columns={4} />

          <Card className="section" title="Weekly completion">
            <div className="row-between" style={{ marginBottom: 'var(--sp-3)' }}>
              <span className="small muted tnum">
                {formatMinutes(week.completed)} of {formatMinutes(week.target)}
              </span>
              <span className="chip is-active tnum">{week.percentInt}%</span>
            </div>
            <ProgressBar percent={week.percent} size="lg" label="Weekly target completion" />
          </Card>

          <div className="section stack">
            <Suspense fallback={<ChartSkeleton />}>
              <WeeklyChart week={week} />
            </Suspense>
          </div>
        </div>
      ) : (
        <div id="panel-month" role="tabpanel" aria-labelledby="tab-month">
          <div className="row-between wrap" style={{ marginBottom: 'var(--sp-4)' }}>
            <h2 style={{ fontSize: 'var(--fs-18)' }}>{month.monthLabel}</h2>
            <div className="row">
              <Button size="sm" variant="ghost" iconOnly icon={ChevronLeft}
                onClick={() => setMonthOffset((o) => o - 1)} aria-label="Previous month" />
              <Button size="sm" variant="ghost" onClick={() => setMonthOffset(0)} disabled={monthOffset === 0}>
                This month
              </Button>
              <Button size="sm" variant="ghost" iconOnly icon={ChevronRight}
                onClick={() => setMonthOffset((o) => Math.min(0, o + 1))}
                disabled={monthOffset >= 0} aria-label="Next month" />
            </div>
          </div>

          <StatGrid items={monthItems} columns={4} />

          <Card className="section" title="Monthly completion">
            <div className="row-between" style={{ marginBottom: 'var(--sp-3)' }}>
              <span className="small muted tnum">
                {formatMinutes(month.completed)} of {formatMinutes(month.target)}
              </span>
              <span className="chip is-active tnum">{month.percentInt}%</span>
            </div>
            <ProgressBar percent={month.percent} size="lg" label="Monthly target completion" />
          </Card>

          <div className="section stack">
            <Suspense fallback={<ChartSkeleton />}>
              <MonthlyChart month={month} />
            </Suspense>
          </div>
        </div>
      )}
    </>
  );
}
