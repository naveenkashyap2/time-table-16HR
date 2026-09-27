/**
 * storage.js — the ONLY module allowed to touch localStorage (PRD §6).
 * Namespaced (`sl_`), versioned, debounced (300 ms per key), quota-safe.
 */

export const SCHEMA_VERSION = 2;

/** PRD §8.1 — storage keys */
export const K = {
  SETTINGS: 'sl_settings',
  SUBJECTS: 'sl_subjects',
  TASKS: 'sl_tasks',
  SESSIONS: 'sl_sessions',
  ACTIVE_SESSION: 'sl_active_session',
  DAILY_RECORDS: 'sl_daily_records',
  DSA: 'sl_dsa',
  PROJECTS: 'sl_projects',
  INTERVIEW: 'sl_interview',
  SD_TOPICS: 'sl_sd_topics',
  DOTNET_TOPICS: 'sl_dotnet_topics',
  RN_TOPICS: 'sl_rn_topics',
  QUOTE_CACHE: 'sl_quote_cache',
  ACHIEVEMENTS: 'sl_achievements',
  SCHEMA_VERSION: 'sl_schema_version',
  LAST_OPEN_DATE: 'sl_last_open_date',
  NOTIFICATIONS: 'sl_notifications',
};

export const ALL_KEYS = Object.values(K);

/* ------------------------------------------------------------------ *
 * Error channel — storage never throws into the UI, it notifies.
 * ------------------------------------------------------------------ */
const listeners = new Set();

/** @param {(err:{type:string,message:string,key?:string})=>void} fn */
export function onStorageError(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emitError(payload) {
  listeners.forEach((fn) => {
    try {
      fn(payload);
    } catch {
      /* listener errors are never fatal */
    }
  });
}

/* ------------------------------------------------------------------ *
 * Availability probe + in-memory fallback (private mode / quota dead)
 * ------------------------------------------------------------------ */
const memory = new Map();
let available = null;

export function isStorageAvailable() {
  if (available !== null) return available;
  try {
    const probe = '__sl_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    available = true;
  } catch {
    available = false;
  }
  return available;
}

/* ------------------------------------------------------------------ *
 * Read
 * ------------------------------------------------------------------ */

/**
 * @template T
 * @param {string} key
 * @param {T} fallback
 * @returns {T}
 */
export function loadData(key, fallback) {
  try {
    if (!isStorageAvailable()) {
      return memory.has(key) ? memory.get(key) : fallback;
    }
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw === undefined || raw === 'undefined') return fallback;
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch (err) {
    // Corrupt JSON — keep the app alive, report once, fall back.
    emitError({
      type: 'corrupt',
      key,
      message: `Saved data for "${key}" was unreadable and has been reset.`,
    });
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* noop */
    }
    return fallback;
  }
}

/* ------------------------------------------------------------------ *
 * Write (debounced 300 ms per key — PRD §4.2)
 * ------------------------------------------------------------------ */
const DEBOUNCE_MS = 300;
const timers = new Map();
const pending = new Map();

function writeThrough(key, value) {
  try {
    if (!isStorageAvailable()) {
      memory.set(key, value);
      return false;
    }
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    const quota =
      err &&
      (err.name === 'QuotaExceededError' ||
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        err.code === 22 ||
        err.code === 1014);
    memory.set(key, value); // keep working in memory for this session
    emitError({
      type: quota ? 'quota' : 'write',
      key,
      message: quota
        ? 'Storage is full — StudyLoop is running from memory. Export a backup and clear old data.'
        : `Could not save "${key}". Changes are kept in memory for this session.`,
    });
    return false;
  }
}

/** Debounced save (300 ms per key). */
export function saveData(key, value) {
  pending.set(key, value);
  if (timers.has(key)) clearTimeout(timers.get(key));
  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key);
      const v = pending.get(key);
      pending.delete(key);
      writeThrough(key, v);
    }, DEBOUNCE_MS),
  );
}

/** Immediate save — timer checkpoints, pagehide, import. */
export function saveDataNow(key, value) {
  if (timers.has(key)) {
    clearTimeout(timers.get(key));
    timers.delete(key);
  }
  pending.delete(key);
  return writeThrough(key, value);
}

/** Flush every queued debounced write right now (pagehide / visibilitychange). */
export function flushPending() {
  timers.forEach((t) => clearTimeout(t));
  timers.clear();
  pending.forEach((value, key) => writeThrough(key, value));
  pending.clear();
}

export function removeData(key) {
  try {
    if (timers.has(key)) {
      clearTimeout(timers.get(key));
      timers.delete(key);
    }
    pending.delete(key);
    memory.delete(key);
    if (isStorageAvailable()) window.localStorage.removeItem(key);
    return true;
  } catch (err) {
    emitError({ type: 'remove', key, message: `Could not remove "${key}".` });
    return false;
  }
}

/** Wipe every StudyLoop key (Settings → Reset, after double confirm). */
export function clearAllData() {
  timers.forEach((t) => clearTimeout(t));
  timers.clear();
  pending.clear();
  memory.clear();
  let ok = true;
  ALL_KEYS.forEach((key) => {
    try {
      if (isStorageAvailable()) window.localStorage.removeItem(key);
    } catch {
      ok = false;
    }
  });
  return ok;
}

/** Rough footprint of StudyLoop data, in bytes. */
export function storageFootprint() {
  if (!isStorageAvailable()) return 0;
  return ALL_KEYS.reduce((sum, key) => {
    const raw = window.localStorage.getItem(key);
    return sum + (raw ? raw.length * 2 : 0); // UTF-16 code units
  }, 0);
}

/* Auto-flush debounced writes before the tab goes away. */
if (typeof window !== 'undefined') {
  const flush = () => flushPending();
  window.addEventListener('pagehide', flush);
  window.addEventListener('beforeunload', flush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}
