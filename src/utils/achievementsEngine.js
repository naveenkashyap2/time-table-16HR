/**
 * achievementsEngine — PRD §9.6
 * Pure evaluator: `evaluateAchievements(state) → newlyUnlocked[]`
 * Runs after every mutation. No side effects, no storage access.
 */
import { ACHIEVEMENTS } from '../data/achievementsCatalog.js';
import { computeStreak } from './streakUtils.js';

/**
 * Reduce the whole domain state down to the few numbers achievements care
 * about. Cheap enough to run on every mutation.
 */
export function computeAchievementStats(state) {
  const records = state?.dailyRecords || {};
  const sessions = state?.sessions || [];
  const dsa = state?.dsa || [];
  const threshold = state?.settings?.streakThresholdPercent ?? 70;

  let bestDayMinutes = 0;
  let totalMinutes = 0;
  Object.values(records).forEach((rec) => {
    const m = Math.max(0, Number(rec?.completedMinutes) || 0);
    totalMinutes += m;
    if (m > bestDayMinutes) bestDayMinutes = m;
  });

  const { longestStreak, currentStreak } = computeStreak(records, threshold);

  return {
    sessions: sessions.length,
    bestDayMinutes,
    totalMinutes,
    longestStreak,
    currentStreak,
    dsaSolved: dsa.filter((p) => p && p.status === 'solved').length,
  };
}

/**
 * @param {object} state domain state ({ dailyRecords, sessions, dsa, achievements, settings })
 * @returns {string[]} ids unlocked by this evaluation (not already unlocked)
 */
export function evaluateAchievements(state) {
  const stats = computeAchievementStats(state);
  const unlocked = state?.achievements || {};
  const newly = [];

  for (const a of ACHIEVEMENTS) {
    if (unlocked[a.id]) continue;
    const value = stats[a.metric] ?? 0;
    if (value >= a.goal) newly.push(a.id);
  }
  return newly;
}

/** Catalog + unlock state + progress towards each locked achievement. */
export function buildAchievementStates(state) {
  const stats = computeAchievementStats(state);
  const unlocked = state?.achievements || {};

  const items = ACHIEVEMENTS.map((a) => {
    const value = stats[a.metric] ?? 0;
    const at = unlocked[a.id] || null;
    return {
      ...a,
      unlocked: Boolean(at),
      unlockedAt: at,
      value,
      percent: a.goal > 0 ? Math.min(100, (value / a.goal) * 100) : 0,
    };
  });

  const unlockedCount = items.filter((i) => i.unlocked).length;

  // Next milestone = closest locked achievement by completion %.
  const next = items
    .filter((i) => !i.unlocked)
    .sort((a, b) => b.percent - a.percent)[0] || null;

  return { items, stats, unlockedCount, total: items.length, next };
}

export function getAchievement(id) {
  return ACHIEVEMENTS.find((a) => a.id === id) || null;
}
