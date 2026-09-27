/**
 * dateUtils — ALL date keys are LOCAL `YYYY-MM-DD`.
 * PRD §8.3: never use toISOString() for keys (UTC off-by-one bugs).
 */

const pad = (n) => String(n).padStart(2, '0');

/** @param {Date} [d] @returns {string} local YYYY-MM-DD */
export function toDateKey(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** @returns {string} today's local date key */
export function todayKey() {
  return toDateKey(new Date());
}

/** Parse a local date key back into a local Date at 00:00:00.000 */
export function fromDateKey(key) {
  const [y, m, d] = String(key).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

export function isValidDateKey(key) {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const d = fromDateKey(key);
  return !Number.isNaN(d.getTime()) && toDateKey(d) === key;
}

/** Timestamp (ms) of local 23:59:59.999 on the given date key. */
export function endOfDayMs(key) {
  const d = fromDateKey(key);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

/** Timestamp (ms) of local 00:00:00.000 on the given date key. */
export function startOfDayMs(key) {
  return fromDateKey(key).getTime();
}

export function addDays(dateOrKey, n) {
  const d = typeof dateOrKey === 'string' ? fromDateKey(dateOrKey) : new Date(dateOrKey);
  d.setDate(d.getDate() + n);
  return d;
}

export function addDayKey(key, n) {
  return toDateKey(addDays(key, n));
}

/** Whole-day difference a - b (both keys), local-safe. */
export function diffDays(aKey, bKey) {
  const MS = 86400000;
  return Math.round((startOfDayMs(aKey) - startOfDayMs(bKey)) / MS);
}

/**
 * Start of the week containing `date`.
 * @param {Date} date
 * @param {number} weekStartsOn 0=Sun … 1=Mon (default)
 */
export function startOfWeek(date, weekStartsOn = 1) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = (d.getDay() - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

export function endOfWeek(date, weekStartsOn = 1) {
  const s = startOfWeek(date, weekStartsOn);
  s.setDate(s.getDate() + 6);
  return s;
}

export function startOfMonth(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function daysInMonth(date) {
  return endOfMonth(date).getDate();
}

/** Inclusive list of local date keys between two dates. */
export function rangeKeys(fromDate, toDate) {
  const out = [];
  const cur = new Date(fromDate);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(toDate);
  end.setHours(0, 0, 0, 0);
  while (cur <= end) {
    out.push(toDateKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/** Last `n` date keys ending today (chronological). */
export function lastNKeys(n, endDate = new Date()) {
  const end = new Date(endDate);
  const start = addDays(end, -(n - 1));
  return rangeKeys(start, end);
}

export const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DOW_MIN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const DOW_LONG = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

/** "Saturday, 27 September 2026" */
export function formatLongDate(d = new Date()) {
  const date = typeof d === 'string' ? fromDateKey(d) : new Date(d);
  return `${DOW_LONG[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** "27 Sep 2026" */
export function formatShortDate(d) {
  if (!d) return '—';
  const date = typeof d === 'string' ? fromDateKey(d) : new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

/** "Sat 27" */
export function formatDayLabel(key) {
  const d = fromDateKey(key);
  return `${DOW_SHORT[d.getDay()]} ${d.getDate()}`;
}

/** Local HH:MM (24h) from a timestamp. */
export function formatClockTime(ts) {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 1-based day-of-year, used for the deterministic fallback quote. */
export function dayOfYear(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}

/** morning | afternoon | evening | night */
export function greetingFor(hour = new Date().getHours()) {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

export function isToday(key) {
  return key === todayKey();
}
