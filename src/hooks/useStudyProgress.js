import { useMemo } from 'react';
import { useStudy } from '../context/StudyContext.jsx';
import {
  todayKey,
  toDateKey,
  rangeKeys,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  daysInMonth,
  addDays,
  formatDayLabel,
  MONTHS,
} from '../utils/dateUtils.js';
import { calculateProgress } from '../utils/calculateProgress.js';
import { msToMinutes, toHours } from '../utils/formatTime.js';

/* =========================================================================
 * Selectors (PRD §7.3). Every derived number is memoised and recomputed
 * only when its source slice changes.
 * ========================================================================= */

/** Today's overall progress, straight from the stored DayRecord (§9.1). */
export function useTodayProgress() {
  const { dailyRecords, settings } = useStudy();
  const key = todayKey();

  return useMemo(() => {
    const rec = dailyRecords[key];
    const target = rec?.targetMinutes ?? settings.dailyTargetMinutes;
    const completed = rec?.completedMinutes ?? 0;
    return {
      dateKey: key,
      perSubject: rec?.perSubject || {},
      ...calculateProgress(completed, target),
    };
  }, [dailyRecords, key, settings.dailyTargetMinutes]);
}

/** Per-subject progress for today. */
export function useSubjectProgress(subjectId) {
  const { dailyRecords, subjects } = useStudy();
  const key = todayKey();

  return useMemo(() => {
    const subject = subjects.find((s) => s.id === subjectId);
    const completed = dailyRecords[key]?.perSubject?.[subjectId] || 0;
    return calculateProgress(completed, subject?.targetMinutes || 0);
  }, [dailyRecords, key, subjects, subjectId]);
}

/** Progress for every subject today, as a map keyed by subject id. */
export function useAllSubjectProgress() {
  const { dailyRecords, subjects } = useStudy();
  const key = todayKey();

  return useMemo(() => {
    const per = dailyRecords[key]?.perSubject || {};
    const out = {};
    subjects.forEach((s) => {
      out[s.id] = calculateProgress(per[s.id] || 0, s.targetMinutes);
    });
    return out;
  }, [dailyRecords, key, subjects]);
}

/** Sum of every subject's target — should equal the daily target (§10.3). */
export function useSubjectTargetTotal() {
  const { subjects } = useStudy();
  return useMemo(
    () => subjects.reduce((sum, s) => sum + (Number(s.targetMinutes) || 0), 0),
    [subjects],
  );
}

/* --------------------------- weekly ------------------------------------ */

/**
 * @param {number} offset 0 = this week, -1 = last week …
 */
export function useWeekStats(offset = 0) {
  const { dailyRecords, sessions, subjects, settings } = useStudy();
  const weekStartsOn = settings.weekStartsOn ?? 1;
  const dailyTarget = settings.dailyTargetMinutes;

  return useMemo(() => {
    const ref = addDays(new Date(), offset * 7);
    const from = startOfWeek(ref, weekStartsOn);
    const to = endOfWeek(ref, weekStartsOn);
    const keys = rangeKeys(from, to);
    const tKey = todayKey();

    const days = keys.map((key) => {
      const rec = dailyRecords[key];
      const minutes = rec?.completedMinutes || 0;
      return {
        dateKey: key,
        label: formatDayLabel(key),
        shortLabel: formatDayLabel(key).split(' ')[0],
        minutes,
        hours: toHours(minutes),
        target: rec?.targetMinutes ?? dailyTarget,
        remaining: Math.max(0, (rec?.targetMinutes ?? dailyTarget) - minutes),
        isToday: key === tKey,
        isFuture: key > tKey,
      };
    });

    const completed = days.reduce((s, d) => s + d.minutes, 0);
    const target = dailyTarget * 7;
    const studied = days.filter((d) => d.minutes > 0);
    const best = studied.reduce((a, b) => (b.minutes > (a?.minutes ?? -1) ? b : a), null);
    const lowest = studied.reduce((a, b) => (b.minutes < (a?.minutes ?? Infinity) ? b : a), null);

    /* subject distribution over the week */
    const perSubject = {};
    keys.forEach((key) => {
      const per = dailyRecords[key]?.perSubject || {};
      Object.entries(per).forEach(([id, mins]) => {
        perSubject[id] = (perSubject[id] || 0) + mins;
      });
    });
    const distribution = subjects
      .map((s) => ({
        id: s.id,
        name: s.name,
        colorKey: s.colorKey,
        minutes: perSubject[s.id] || 0,
        hours: toHours(perSubject[s.id] || 0),
      }))
      .filter((s) => s.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes);

    const weekSessions = sessions.filter((s) => keys.includes(s.dateKey));

    return {
      from,
      to,
      keys,
      days,
      distribution,
      sessionCount: weekSessions.length,
      avgPerDay: Math.round(completed / 7),
      avgPerStudiedDay: studied.length ? Math.round(completed / studied.length) : 0,
      bestDay: best,
      lowestDay: lowest,
      label:
        offset === 0
          ? 'This week'
          : offset === -1
            ? 'Last week'
            : `${toDateKey(from)} → ${toDateKey(to)}`,
      ...calculateProgress(completed, target),
    };
  }, [dailyRecords, sessions, subjects, dailyTarget, weekStartsOn, offset]);
}

/* --------------------------- monthly ----------------------------------- */

/**
 * @param {number} offset 0 = this month, -1 = last month …
 */
export function useMonthStats(offset = 0) {
  const { dailyRecords, sessions, subjects, settings } = useStudy();
  const dailyTarget = settings.dailyTargetMinutes;

  return useMemo(() => {
    const now = new Date();
    const ref = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const from = startOfMonth(ref);
    const to = endOfMonth(ref);
    const keys = rangeKeys(from, to);
    const tKey = todayKey();
    const dim = daysInMonth(ref);

    const days = keys.map((key) => {
      const rec = dailyRecords[key];
      const minutes = rec?.completedMinutes || 0;
      return {
        dateKey: key,
        day: Number(key.slice(8, 10)),
        label: key.slice(8, 10),
        minutes,
        hours: toHours(minutes),
        target: rec?.targetMinutes ?? dailyTarget,
        isToday: key === tKey,
        isFuture: key > tKey,
      };
    });

    const completed = days.reduce((s, d) => s + d.minutes, 0);
    const target = dailyTarget * dim;
    const studied = days.filter((d) => d.minutes > 0);

    const perSubject = {};
    keys.forEach((key) => {
      const per = dailyRecords[key]?.perSubject || {};
      Object.entries(per).forEach(([id, mins]) => {
        perSubject[id] = (perSubject[id] || 0) + mins;
      });
    });
    const distribution = subjects
      .map((s) => ({
        id: s.id,
        name: s.name,
        colorKey: s.colorKey,
        minutes: perSubject[s.id] || 0,
        hours: toHours(perSubject[s.id] || 0),
      }))
      .filter((s) => s.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes);

    const monthSessions = sessions.filter((s) => keys.includes(s.dateKey));
    const longest = monthSessions.reduce(
      (a, b) => (b.durationMs > (a?.durationMs ?? -1) ? b : a),
      null,
    );

    return {
      from,
      to,
      keys,
      days,
      distribution,
      daysInMonth: dim,
      studiedDays: studied.length,
      sessionCount: monthSessions.length,
      longestSessionMinutes: longest ? msToMinutes(longest.durationMs) : 0,
      longestSessionSubjectId: longest?.subjectId || null,
      mostStudied: distribution[0] || null,
      avgPerDay: Math.round(completed / dim),
      avgPerStudiedDay: studied.length ? Math.round(completed / studied.length) : 0,
      monthLabel: `${MONTHS[ref.getMonth()]} ${ref.getFullYear()}`,
      ...calculateProgress(completed, target),
    };
  }, [dailyRecords, sessions, subjects, dailyTarget, offset]);
}

/* --------------------------- sessions ---------------------------------- */

/** Most recent sessions, newest first. */
export function useRecentSessions(limit = 5) {
  const { sessions } = useStudy();
  return useMemo(
    () => [...sessions].sort((a, b) => b.endAt - a.endAt).slice(0, limit),
    [sessions, limit],
  );
}

/** Today's sessions, newest first. */
export function useTodaySessions() {
  const { sessions } = useStudy();
  const key = todayKey();
  return useMemo(
    () => sessions.filter((s) => s.dateKey === key).sort((a, b) => b.endAt - a.endAt),
    [sessions, key],
  );
}

/** Everything the day-detail panel needs for one date. */
export function useDayDetail(dateKey) {
  const { dailyRecords, sessions, subjects, tasks, settings } = useStudy();

  return useMemo(() => {
    if (!dateKey) return null;
    const rec = dailyRecords[dateKey];
    const target = rec?.targetMinutes ?? settings.dailyTargetMinutes;
    const completed = rec?.completedMinutes ?? 0;
    const per = rec?.perSubject || {};

    const bySubject = subjects
      .map((s) => ({ id: s.id, name: s.name, colorKey: s.colorKey, minutes: per[s.id] || 0 }))
      .filter((s) => s.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes);

    // sessions whose subject was deleted still count — show them as Unknown
    Object.entries(per).forEach(([id, minutes]) => {
      if (!subjects.some((s) => s.id === id)) {
        bySubject.push({ id, name: 'Deleted subject', colorKey: 'primary', minutes });
      }
    });

    const daySessions = sessions
      .filter((s) => s.dateKey === dateKey)
      .sort((a, b) => a.startAt - b.startAt);

    const tasksDone = tasks.filter((t) => (t.doneDates || []).includes(dateKey));

    return {
      dateKey,
      bySubject,
      sessions: daySessions,
      tasksDone,
      tasksTotal: tasks.length,
      ...calculateProgress(completed, target),
    };
  }, [dateKey, dailyRecords, sessions, subjects, tasks, settings.dailyTargetMinutes]);
}

/** Task completion for a given date, grouped per subject. */
export function useTaskStats(dateKey = todayKey()) {
  const { tasks, subjects } = useStudy();

  return useMemo(() => {
    const bySubject = subjects.map((s) => {
      const list = tasks.filter((t) => t.subjectId === s.id);
      const done = list.filter((t) => (t.doneDates || []).includes(dateKey)).length;
      return { subject: s, tasks: list, done, total: list.length };
    });
    const total = tasks.length;
    const done = tasks.filter((t) => (t.doneDates || []).includes(dateKey)).length;
    return { bySubject, total, done, remaining: Math.max(0, total - done) };
  }, [tasks, subjects, dateKey]);
}
