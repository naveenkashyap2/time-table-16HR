import { describe, it, expect } from 'vitest';
import { buildBackup, validateBackup } from '../utils/backup.js';
import { buildSeedState } from '../data/seed.js';

describe('export / import round-trip', () => {
  const seeded = buildSeedState({ onboarded: true });

  it('exports a complete, re-importable bundle', () => {
    const backup = buildBackup(seeded);
    expect(backup.app).toBe('StudyLoop');
    expect(backup.schemaVersion).toBe(2);
    expect(backup.exportedAt).toBeTruthy();
    expect(backup.subjects).toHaveLength(7);

    const result = validateBackup(JSON.stringify(backup));
    expect(result.ok).toBe(true);
    expect(result.summary.subjects).toBe(7);
    expect(result.data.settings.dailyTargetMinutes).toBe(960);
  });

  it('rejects non-JSON without touching anything', () => {
    const r = validateBackup('<html>nope</html>');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/not valid JSON/i);
  });

  it('rejects a backup from another app', () => {
    const r = validateBackup(JSON.stringify({ app: 'OtherApp', settings: {} }));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/OtherApp/);
  });

  it('rejects missing settings', () => {
    expect(validateBackup(JSON.stringify({ subjects: [] })).ok).toBe(false);
  });

  it('rejects a malformed subject', () => {
    const backup = buildBackup(seeded);
    backup.subjects = [{ id: 'x' }]; // no name / targetMinutes
    const r = validateBackup(JSON.stringify(backup));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/subject entry/i);
  });

  it('rejects a session with a bad date key', () => {
    const backup = buildBackup(seeded);
    backup.sessions = [
      { id: 's', subjectId: 'a', durationMs: 1000, dateKey: '27/09/2026' },
    ];
    const r = validateBackup(JSON.stringify(backup));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/invalid dateKey/i);
  });

  it('rejects an invalid dailyRecords key', () => {
    const backup = buildBackup(seeded);
    backup.dailyRecords = { 'not-a-date': { targetMinutes: 960 } };
    expect(validateBackup(JSON.stringify(backup)).ok).toBe(false);
  });

  it('summarises totals for the confirmation modal', () => {
    const backup = buildBackup(seeded);
    backup.sessions = [
      { id: 's1', subjectId: 'a', durationMs: 3_600_000, dateKey: '2026-09-27' },
    ];
    backup.dailyRecords = {
      '2026-09-27': { dateKey: '2026-09-27', targetMinutes: 960, completedMinutes: 60, perSubject: { a: 60 } },
    };
    const r = validateBackup(JSON.stringify(backup));
    expect(r.ok).toBe(true);
    expect(r.summary.sessions).toBe(1);
    expect(r.summary.totalMinutes).toBe(60);
  });
});
