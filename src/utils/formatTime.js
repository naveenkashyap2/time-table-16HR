/**
 * formatTime — all durations are handled in MINUTES or MILLISECONDS.
 * Negative inputs are clamped to 0 (PRD §15 "negative safety").
 */

const safe = (n) => (Number.isFinite(n) && n > 0 ? n : 0);
const pad = (n) => String(n).padStart(2, '0');

/** 615 → "10h 15m" · 60 → "1h" · 45 → "45m" · 0 → "0m" */
export function formatMinutes(mins) {
  const m = Math.floor(safe(mins));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r}m`;
  if (r === 0) return `${h}h`;
  return `${h}h ${r}m`;
}

/** 615 → "10:15" (clock-style HH:MM) */
export function formatHHMM(mins) {
  const m = Math.floor(safe(mins));
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

/** ms → "HH:MM:SS" for the timer display (hours are not capped at 24) */
export function formatHMS(ms) {
  const total = Math.floor(safe(ms) / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** ms → minutes (floor) */
export function msToMinutes(ms) {
  return Math.floor(safe(ms) / 60000);
}

/** minutes → ms */
export function minutesToMs(mins) {
  return Math.floor(safe(mins)) * 60000;
}

/** 615 → "10.3" (one decimal hour, for chart axes) */
export function toHours(mins, decimals = 1) {
  return Number((safe(mins) / 60).toFixed(decimals));
}

/** 615 → "10.3h" */
export function formatHoursShort(mins, decimals = 1) {
  return `${toHours(mins, decimals)}h`;
}

/** ms duration → human sentence fragment, e.g. "1h 24m" / "45m" / "38s" */
export function formatDurationMs(ms) {
  const v = safe(ms);
  if (v < 60000) return `${Math.floor(v / 1000)}s`;
  return formatMinutes(msToMinutes(v));
}
