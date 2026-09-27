/**
 * migrations.js — PRD §8.2
 * Every record set carries a schemaVersion. On load, `migrate()` upgrades old
 * shapes so a future StudyLoop update can never wipe a user's history.
 */
import { K, SCHEMA_VERSION, loadData, saveDataNow } from './storage.js';

/**
 * v1 → v2
 * v1 stored `dailyRecords` as an ARRAY and settings without the newer flags.
 * The hook is wired even where it is a no-op, exactly as the PRD requires.
 */
function v1_to_v2(bundle) {
  const next = { ...bundle };

  // dailyRecords: array → map keyed by dateKey
  if (Array.isArray(next[K.DAILY_RECORDS])) {
    next[K.DAILY_RECORDS] = next[K.DAILY_RECORDS].reduce((acc, rec) => {
      if (rec && rec.dateKey) acc[rec.dateKey] = rec;
      return acc;
    }, {});
  }

  // settings: fill in fields introduced in v2
  const s = next[K.SETTINGS];
  if (s && typeof s === 'object') {
    next[K.SETTINGS] = {
      ...s,
      schemaVersion: 2,
      streakThresholdPercent:
        typeof s.streakThresholdPercent === 'number' ? s.streakThresholdPercent : 70,
      weekStartsOn: typeof s.weekStartsOn === 'number' ? s.weekStartsOn : 1,
      notifications: {
        sessionComplete: true,
        streakWarning: true,
        dailySummary: false,
        ...(s.notifications || {}),
      },
      quote: { enabled: true, tone: 'discipline', ...(s.quote || {}) },
    };
  }

  // achievements: array of ids → { id: unlockedAt }
  if (Array.isArray(next[K.ACHIEVEMENTS])) {
    const now = new Date().toISOString();
    next[K.ACHIEVEMENTS] = next[K.ACHIEVEMENTS].reduce((acc, id) => {
      if (typeof id === 'string') acc[id] = now;
      return acc;
    }, {});
  }

  return next;
}

/** Ordered migration ladder. Add `2: v2_to_v3` etc. in future releases. */
const STEPS = { 1: v1_to_v2 };

/**
 * Run every pending migration over an in-memory bundle of storage values.
 * @param {Record<string, any>} bundle  { [storageKey]: value }
 * @param {number} fromVersion
 * @returns {{ bundle: Record<string, any>, migrated: boolean, from: number, to: number }}
 */
export function migrateBundle(bundle, fromVersion) {
  let version = Number(fromVersion) || SCHEMA_VERSION;
  let out = bundle;
  let migrated = false;

  while (version < SCHEMA_VERSION && STEPS[version]) {
    out = STEPS[version](out);
    version += 1;
    migrated = true;
  }

  return { bundle: out, migrated, from: Number(fromVersion) || version, to: version };
}

/**
 * Read the stored schema version, run migrations against real storage, persist.
 * Called once, before the StudyContext reducer initialises.
 */
export function migrate() {
  const stored = loadData(K.SCHEMA_VERSION, null);

  // Brand new install: nothing to migrate, stamp the current version.
  if (stored === null) {
    saveDataNow(K.SCHEMA_VERSION, SCHEMA_VERSION);
    return { migrated: false, from: SCHEMA_VERSION, to: SCHEMA_VERSION };
  }

  const from = Number(stored) || 1;
  if (from >= SCHEMA_VERSION) return { migrated: false, from, to: from };

  const KEYS_TO_MIGRATE = [
    K.SETTINGS, K.SUBJECTS, K.TASKS, K.SESSIONS, K.DAILY_RECORDS, K.DSA,
    K.PROJECTS, K.INTERVIEW, K.SD_TOPICS, K.DOTNET_TOPICS, K.RN_TOPICS,
    K.ACHIEVEMENTS,
  ];

  const bundle = {};
  KEYS_TO_MIGRATE.forEach((key) => {
    bundle[key] = loadData(key, undefined);
  });

  const result = migrateBundle(bundle, from);

  Object.entries(result.bundle).forEach(([key, value]) => {
    if (value !== undefined) saveDataNow(key, value);
  });
  saveDataNow(K.SCHEMA_VERSION, SCHEMA_VERSION);

  return { migrated: result.migrated, from, to: SCHEMA_VERSION };
}
