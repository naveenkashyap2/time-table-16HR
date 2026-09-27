/**
 * dayRecords — DayRecord derivation helpers (PRD §8.3 / §9.1 / §9.3).
 * A DayRecord is the authoritative per-day roll-up:
 *   { dateKey, targetMinutes, completedMinutes, perSubject, updatedAt }
 */
import { todayKey } from './dateUtils.js';
import { msToMinutes } from './formatTime.js';

export function emptyDayRecord(dateKey, targetMinutes) {
  return {
    dateKey,
    targetMinutes: Math.max(0, Number(targetMinutes) || 0),
    completedMinutes: 0,
    perSubject: {},
    updatedAt: Date.now(),
  };
}

/** Sum of a perSubject map. */
export function sumPerSubject(perSubject) {
  return Object.values(perSubject || {}).reduce(
    (sum, v) => sum + (Number(v) || 0),
    0,
  );
}

/**
 * Immutably fold a session's minutes into the records map.
 * `completedMinutes` is always recomputed as Σ perSubject (PRD §9.1).
 */
export function applySessionToRecords(records, session, defaultTargetMinutes) {
  const map = { ...(records || {}) };
  const key = session.dateKey;
  const prev = map[key] || emptyDayRecord(key, defaultTargetMinutes);
  const minutes = msToMinutes(session.durationMs);
  if (minutes <= 0) return map;

  const perSubject = {
    ...prev.perSubject,
    [session.subjectId]: (Number(prev.perSubject?.[session.subjectId]) || 0) + minutes,
  };

  map[key] = {
    ...prev,
    perSubject,
    completedMinutes: sumPerSubject(perSubject),
    updatedAt: Date.now(),
  };
  return map;
}

/**
 * Rebuild every DayRecord from the session log — used after import and as a
 * self-healing pass. Targets from existing records are preserved.
 */
export function rebuildRecords(sessions, existingRecords, defaultTargetMinutes) {
  const map = {};
  (sessions || []).forEach((s) => {
    if (!s || !s.dateKey) return;
    const minutes = msToMinutes(s.durationMs);
    if (minutes <= 0) return;
    if (!map[s.dateKey]) {
      map[s.dateKey] = emptyDayRecord(
        s.dateKey,
        existingRecords?.[s.dateKey]?.targetMinutes ?? defaultTargetMinutes,
      );
    }
    const rec = map[s.dateKey];
    rec.perSubject[s.subjectId] = (rec.perSubject[s.subjectId] || 0) + minutes;
  });

  // Keep days that already existed so we do not lose their target, but drop the
  // derived totals: perSubject/completedMinutes are a pure function of the
  // session log, so a day with no surviving sessions must fall back to zero.
  Object.entries(existingRecords || {}).forEach(([key, rec]) => {
    if (!map[key]) {
      map[key] = emptyDayRecord(key, rec?.targetMinutes ?? defaultTargetMinutes);
    }
  });

  Object.values(map).forEach((rec) => {
    rec.completedMinutes = sumPerSubject(rec.perSubject);
    rec.updatedAt = Date.now();
  });

  return map;
}

/**
 * Daily rollover (PRD §9.3): make sure today's record exists with the current
 * target, leaving every previous day untouched.
 */
export function ensureTodayRecord(records, targetMinutes, dateKey = todayKey()) {
  const map = records || {};
  const existing = map[dateKey];
  if (existing && existing.targetMinutes === targetMinutes) return map;
  return {
    ...map,
    [dateKey]: existing
      ? { ...existing, targetMinutes, updatedAt: Date.now() }
      : emptyDayRecord(dateKey, targetMinutes),
  };
}

/** Re-target today + all future-dated records when the daily goal changes. */
export function retargetFrom(records, dateKey, targetMinutes) {
  const map = { ...(records || {}) };
  Object.keys(map).forEach((key) => {
    if (key >= dateKey) {
      map[key] = { ...map[key], targetMinutes, updatedAt: Date.now() };
    }
  });
  if (!map[dateKey]) map[dateKey] = emptyDayRecord(dateKey, targetMinutes);
  return map;
}
