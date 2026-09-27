import { useMemo } from 'react';
import { useStudy } from '../context/StudyContext.jsx';
import { todayKey, startOfWeek, addDays, rangeKeys, toDateKey, MONTHS_SHORT } from '../utils/dateUtils.js';
import { heatLevel } from '../utils/heatmap.js';

/**
 * GitHub-style heatmap data (PRD §9.5).
 * Returns `weeks` = array of 7-cell columns, oldest first.
 */
export function useHeatmapData(weeks = 26) {
  const { dailyRecords, settings } = useStudy();
  const weekStartsOn = settings.weekStartsOn ?? 1;

  return useMemo(() => {
    const today = new Date();
    const tKey = todayKey();
    // Align the grid so every column is a full week.
    const lastColStart = startOfWeek(today, weekStartsOn);
    const firstColStart = addDays(lastColStart, -(weeks - 1) * 7);
    const lastColEnd = addDays(lastColStart, 6);

    const keys = rangeKeys(firstColStart, lastColEnd);

    const cells = keys.map((key) => {
      const rec = dailyRecords[key];
      const minutes = rec?.completedMinutes || 0;
      return {
        dateKey: key,
        minutes,
        target: rec?.targetMinutes ?? settings.dailyTargetMinutes,
        level: heatLevel(minutes),
        isToday: key === tKey,
        isFuture: key > tKey,
      };
    });

    const columns = [];
    for (let i = 0; i < cells.length; i += 7) columns.push(cells.slice(i, i + 7));

    // Month labels: show a label on the first column of each new month.
    const monthLabels = columns.map((col, i) => {
      const first = col[0];
      if (!first) return '';
      const d = new Date(first.dateKey.slice(0, 4), Number(first.dateKey.slice(5, 7)) - 1, 1);
      const prev = columns[i - 1]?.[0];
      const prevMonth = prev ? Number(prev.dateKey.slice(5, 7)) : -1;
      const thisMonth = Number(first.dateKey.slice(5, 7));
      return thisMonth !== prevMonth ? MONTHS_SHORT[d.getMonth()] : '';
    });

    const totalMinutes = cells.reduce((s, c) => s + c.minutes, 0);
    const activeDays = cells.filter((c) => c.minutes > 0).length;

    return {
      columns,
      monthLabels,
      from: toDateKey(firstColStart),
      to: toDateKey(lastColEnd),
      totalMinutes,
      activeDays,
      weekStartsOn,
    };
  }, [dailyRecords, weeks, weekStartsOn, settings.dailyTargetMinutes]);
}
