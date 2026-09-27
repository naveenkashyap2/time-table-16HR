import { describe, it, expect } from 'vitest';
import {
  applySessionToRecords, ensureTodayRecord, rebuildRecords, emptyDayRecord, retargetFrom,
} from '../utils/dayRecords.js';

const session = (over) => ({
  id: 's1', subjectId: 'sub1', dateKey: '2026-09-27',
  startAt: 0, endAt: 3_600_000, durationMs: 3_600_000, source: 'timer', ...over,
});

describe('day records / rollover', () => {
  it('folds a session into a fresh day', () => {
    const next = applySessionToRecords({}, session(), 960);
    expect(next['2026-09-27'].completedMinutes).toBe(60);
    expect(next['2026-09-27'].perSubject.sub1).toBe(60);
    expect(next['2026-09-27'].targetMinutes).toBe(960);
  });

  it('accumulates multiple sessions per subject', () => {
    let recs = applySessionToRecords({}, session(), 960);
    recs = applySessionToRecords(recs, session({ id: 's2', durationMs: 1_800_000 }), 960);
    expect(recs['2026-09-27'].perSubject.sub1).toBe(90);
    expect(recs['2026-09-27'].completedMinutes).toBe(90);
  });

  it('keeps completedMinutes equal to the sum of perSubject', () => {
    let recs = applySessionToRecords({}, session(), 960);
    recs = applySessionToRecords(recs, session({ id: 's2', subjectId: 'sub2', durationMs: 1_200_000 }), 960);
    const rec = recs['2026-09-27'];
    const sum = Object.values(rec.perSubject).reduce((a, b) => a + b, 0);
    expect(rec.completedMinutes).toBe(sum);
    expect(sum).toBe(80);
  });

  it('ignores sub-minute sessions', () => {
    const next = applySessionToRecords({}, session({ durationMs: 30_000 }), 960);
    expect(next['2026-09-27']).toBeUndefined();
  });

  it('creates today without touching history (rollover §9.3)', () => {
    const history = { '2026-09-26': emptyDayRecord('2026-09-26', 960) };
    history['2026-09-26'].completedMinutes = 700;
    const next = ensureTodayRecord(history, 960, '2026-09-27');
    expect(next['2026-09-27'].completedMinutes).toBe(0);
    expect(next['2026-09-26'].completedMinutes).toBe(700); // preserved
  });

  it('is idempotent when today already exists with the same target', () => {
    const recs = { '2026-09-27': emptyDayRecord('2026-09-27', 960) };
    expect(ensureTodayRecord(recs, 960, '2026-09-27')).toBe(recs);
  });

  it('rebuilds every record from the session log (import path)', () => {
    const sessions = [
      session(),
      session({ id: 's2', dateKey: '2026-09-26', durationMs: 7_200_000 }),
    ];
    const recs = rebuildRecords(sessions, {}, 960);
    expect(recs['2026-09-27'].completedMinutes).toBe(60);
    expect(recs['2026-09-26'].completedMinutes).toBe(120);
  });

  it('retargets today and future days only', () => {
    const recs = {
      '2026-09-26': emptyDayRecord('2026-09-26', 960),
      '2026-09-27': emptyDayRecord('2026-09-27', 960),
      '2026-09-28': emptyDayRecord('2026-09-28', 960),
    };
    const next = retargetFrom(recs, '2026-09-27', 600);
    expect(next['2026-09-26'].targetMinutes).toBe(960); // history untouched
    expect(next['2026-09-27'].targetMinutes).toBe(600);
    expect(next['2026-09-28'].targetMinutes).toBe(600);
  });
});
