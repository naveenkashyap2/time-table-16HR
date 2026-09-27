import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useStudy } from '../context/StudyContext.jsx';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import {
  startOfMonth, endOfMonth, rangeKeys, todayKey, MONTHS, DOW_MIN, toDateKey,
} from '../utils/dateUtils.js';
import { heatLevel } from '../utils/heatmap.js';
import { formatMinutes, toHours } from '../utils/formatTime.js';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import StudyHeatmap from '../components/Analytics/StudyHeatmap.jsx';
import DayDetailPanel from '../components/Analytics/DayDetailPanel.jsx';

export default function Calendar() {
  useDocumentMeta(
    'Calendar',
    'Month-by-month study calendar with a 26-week consistency heatmap and per-day breakdowns.',
  );

  const { dailyRecords, settings } = useStudy();
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(todayKey());

  const weekStartsOn = settings.weekStartsOn ?? 1;

  const { cells, label, monthTotal, activeDays } = useMemo(() => {
    const now = new Date();
    const ref = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const from = startOfMonth(ref);
    const to = endOfMonth(ref);
    const keys = rangeKeys(from, to);

    const leading = (from.getDay() - weekStartsOn + 7) % 7;
    const blanks = Array.from({ length: leading }, (_, i) => ({ blank: true, id: `b${i}` }));

    const days = keys.map((key) => {
      const rec = dailyRecords[key];
      const minutes = rec?.completedMinutes || 0;
      return {
        key,
        day: Number(key.slice(8, 10)),
        minutes,
        target: rec?.targetMinutes ?? settings.dailyTargetMinutes,
        level: heatLevel(minutes),
        isToday: key === todayKey(),
        isFuture: key > todayKey(),
      };
    });

    return {
      cells: [...blanks, ...days],
      label: `${MONTHS[ref.getMonth()]} ${ref.getFullYear()}`,
      monthTotal: days.reduce((s, d) => s + d.minutes, 0),
      activeDays: days.filter((d) => d.minutes > 0).length,
    };
  }, [dailyRecords, offset, settings.dailyTargetMinutes, weekStartsOn]);

  const dow = Array.from({ length: 7 }, (_, i) => DOW_MIN[(i + weekStartsOn) % 7]);

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Calendar</h1>
          <p className="page-sub">
            {formatMinutes(monthTotal)} across {activeDays} day{activeDays === 1 ? '' : 's'} in {label}
          </p>
        </div>
        <div className="row">
          <Button size="sm" variant="ghost" iconOnly icon={ChevronLeft}
            onClick={() => setOffset((o) => o - 1)} aria-label="Previous month" />
          <Button size="sm" variant="ghost" onClick={() => { setOffset(0); setSelected(todayKey()); }}>
            Today
          </Button>
          <Button size="sm" variant="ghost" iconOnly icon={ChevronRight}
            onClick={() => setOffset((o) => o + 1)} aria-label="Next month" />
        </div>
      </header>

      <div className="two-col">
        <Card title={label} icon={CalendarDays}>
          <div className="cal-grid" role="grid" aria-label={`Study calendar for ${label}`}>
            {dow.map((d, i) => (
              <div className="cal-dow" key={`${d}-${i}`} role="columnheader">
                {d}
              </div>
            ))}
            {cells.map((c) =>
              c.blank ? (
                <div className="cal-cell is-blank" key={c.id} aria-hidden="true" />
              ) : (
                <button
                  key={c.key}
                  type="button"
                  className="cal-cell"
                  data-level={c.level}
                  data-today={c.isToday}
                  onClick={() => setSelected(c.key)}
                  aria-pressed={selected === c.key}
                  aria-label={`${c.key}: ${formatMinutes(c.minutes)} of ${formatMinutes(c.target)}`}
                  style={
                    selected === c.key
                      ? { outline: '2px solid var(--primary)', outlineOffset: 1 }
                      : undefined
                  }
                >
                  <span className="cal-daynum">{c.day}</span>
                  <span className="cal-hours">
                    {c.isFuture ? '' : `${toHours(c.minutes)}/${toHours(c.target, 0)}h`}
                  </span>
                </button>
              ),
            )}
          </div>
        </Card>

        <DayDetailPanel dateKey={selected} />
      </div>

      <Card className="section" title="26-week consistency">
        <StudyHeatmap weeks={26} onSelectDay={setSelected} selectedKey={selected} />
      </Card>
    </>
  );
}
