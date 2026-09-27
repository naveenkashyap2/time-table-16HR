/**
 * calculateProgress — PRD §9.1
 *   remainingMinutes = max(0, target - completed)
 *   displayPercent   = min(100, completed / target * 100)   // clamp DISPLAY only
 * Over-completion is allowed: real minutes are always preserved.
 */

/** Raw (unclamped) percentage. Zero-target safety → 0. */
export function rawPercent(completed, target) {
  const c = Number(completed) || 0;
  const t = Number(target) || 0;
  if (t <= 0) return 0;
  return (Math.max(0, c) / t) * 100;
}

/** Display percentage: clamped to [0, 100]. */
export function calculatePercent(completed, target) {
  return Math.min(100, Math.max(0, rawPercent(completed, target)));
}

/** Rounded integer display percentage. */
export function percentInt(completed, target) {
  return Math.round(calculatePercent(completed, target));
}

export function remainingMinutes(completed, target) {
  const c = Math.max(0, Number(completed) || 0);
  const t = Math.max(0, Number(target) || 0);
  return Math.max(0, t - c);
}

/** Everything a progress UI needs, in one memo-friendly object. */
export function calculateProgress(completed, target) {
  const c = Math.max(0, Number(completed) || 0);
  const t = Math.max(0, Number(target) || 0);
  const percent = calculatePercent(c, t);
  return {
    completed: c,
    target: t,
    remaining: remainingMinutes(c, t),
    percent,
    percentInt: Math.round(percent),
    rawPercent: rawPercent(c, t),
    isComplete: t > 0 && c >= t,
    isOver: t > 0 && c > t,
    overBy: t > 0 ? Math.max(0, c - t) : 0,
  };
}

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
