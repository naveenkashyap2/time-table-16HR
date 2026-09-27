/**
 * streakUtils — PRD §9.4
 *
 *   qualifies(day) = day.completedMinutes >= threshold% / 100 * day.targetMinutes
 *   currentStreak  = consecutive qualified days ending today,
 *                    or ending yesterday if today has not qualified yet
 *   longestStreak  = max run across all DayRecords
 *   totalStudyDays = count(days with completedMinutes > 0)
 */
import { todayKey, addDayKey, diffDays } from './dateUtils.js';

/** Minutes needed for a given day's record to count towards the streak. */
export function requiredMinutes(record, thresholdPercent = 70) {
  const target = Math.max(0, Number(record?.targetMinutes) || 0);
  const pct = Math.max(0, Math.min(100, Number(thresholdPercent) || 0));
  return Math.ceil((pct / 100) * target);
}

export function qualifies(record, thresholdPercent = 70) {
  if (!record) return false;
  const target = Math.max(0, Number(record.targetMinutes) || 0);
  const completed = Math.max(0, Number(record.completedMinutes) || 0);
  if (target <= 0) return completed > 0; // no target set → any study counts
  return completed >= requiredMinutes(record, thresholdPercent);
}

/**
 * @param {Record<string, any>} dailyRecords  map keyed by local dateKey
 * @param {number} thresholdPercent
 * @param {string} [refKey] treat this key as "today" (tests / rollover)
 */
export function computeStreak(dailyRecords, thresholdPercent = 70, refKey = todayKey()) {
  const records = dailyRecords || {};
  const keys = Object.keys(records).sort(); // lexicographic === chronological

  const todayRec = records[refKey];
  const todayQualified = qualifies(todayRec, thresholdPercent);

  /* ---- current streak ------------------------------------------------- */
  // Walk back from today; if today isn't qualified yet the streak may still be
  // alive via yesterday (the day is "pending", not broken).
  let cursor = todayQualified ? refKey : addDayKey(refKey, -1);
  let current = 0;
  while (qualifies(records[cursor], thresholdPercent)) {
    current += 1;
    cursor = addDayKey(cursor, -1);
  }

  /* ---- longest streak ------------------------------------------------- */
  let longest = 0;
  let run = 0;
  let prevKey = null;
  for (const key of keys) {
    if (!qualifies(records[key], thresholdPercent)) {
      run = 0;
      prevKey = key;
      continue;
    }
    run = prevKey && diffDays(key, prevKey) === 1 && qualifies(records[prevKey], thresholdPercent)
      ? run + 1
      : 1;
    if (run > longest) longest = run;
    prevKey = key;
  }
  longest = Math.max(longest, current);

  /* ---- totals --------------------------------------------------------- */
  let totalStudyDays = 0;
  let totalMinutes = 0;
  let qualifiedDays = 0;
  for (const key of keys) {
    const mins = Math.max(0, Number(records[key]?.completedMinutes) || 0);
    if (mins > 0) totalStudyDays += 1;
    totalMinutes += mins;
    if (qualifies(records[key], thresholdPercent)) qualifiedDays += 1;
  }

  const need = requiredMinutes(
    todayRec || { targetMinutes: 0 },
    thresholdPercent,
  );
  const done = Math.max(0, Number(todayRec?.completedMinutes) || 0);

  return {
    currentStreak: current,
    longestStreak: longest,
    totalStudyDays,
    totalMinutes,
    qualifiedDays,
    todayQualified,
    /** minutes still needed today to keep the streak alive */
    minutesToKeepStreak: Math.max(0, need - done),
    thresholdMinutes: need,
    /** streak is alive but today has not been secured yet */
    todayPending: !todayQualified && current > 0,
    /** at risk = streak exists, today pending */
    atRisk: !todayQualified && current > 0,
  };
}
