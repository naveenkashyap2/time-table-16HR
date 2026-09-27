import { describe, it, expect } from 'vitest';
import { migrateBundle } from '../utils/migrations.js';
import { K, SCHEMA_VERSION } from '../utils/storage.js';

describe('schema migrations', () => {
  it('converts a v1 dailyRecords array into a keyed map', () => {
    const bundle = {
      [K.DAILY_RECORDS]: [
        { dateKey: '2026-09-26', targetMinutes: 960, completedMinutes: 700 },
        { dateKey: '2026-09-27', targetMinutes: 960, completedMinutes: 300 },
      ],
    };
    const { bundle: out, migrated, to } = migrateBundle(bundle, 1);
    expect(migrated).toBe(true);
    expect(to).toBe(SCHEMA_VERSION);
    expect(out[K.DAILY_RECORDS]['2026-09-26'].completedMinutes).toBe(700);
    expect(Array.isArray(out[K.DAILY_RECORDS])).toBe(false);
  });

  it('backfills settings fields added in v2', () => {
    const bundle = { [K.SETTINGS]: { userName: 'Naveen', dailyTargetMinutes: 960 } };
    const { bundle: out } = migrateBundle(bundle, 1);
    expect(out[K.SETTINGS].streakThresholdPercent).toBe(70);
    expect(out[K.SETTINGS].weekStartsOn).toBe(1);
    expect(out[K.SETTINGS].notifications.sessionComplete).toBe(true);
    expect(out[K.SETTINGS].quote.tone).toBe('discipline');
    expect(out[K.SETTINGS].userName).toBe('Naveen'); // preserved
  });

  it('converts a v1 achievements array into an unlock map', () => {
    const { bundle: out } = migrateBundle({ [K.ACHIEVEMENTS]: ['first-session'] }, 1);
    expect(Array.isArray(out[K.ACHIEVEMENTS])).toBe(false);
    expect(out[K.ACHIEVEMENTS]['first-session']).toBeTruthy();
  });

  it('is a no-op when already current', () => {
    const bundle = { [K.SETTINGS]: { dailyTargetMinutes: 960 } };
    const { migrated } = migrateBundle(bundle, SCHEMA_VERSION);
    expect(migrated).toBe(false);
  });

  it('never destroys unknown keys', () => {
    const { bundle: out } = migrateBundle({ [K.SUBJECTS]: [{ id: 'a' }] }, 1);
    expect(out[K.SUBJECTS]).toEqual([{ id: 'a' }]);
  });
});
