import { describe, it, expect } from 'vitest';
import { computeStreak, qualifies, requiredMinutes } from '../utils/streakUtils.js';

const day = (completedMinutes, targetMinutes = 960) => ({
  targetMinutes,
  completedMinutes,
  perSubject: {},
});

describe('streak engine', () => {
  it('requires 70% of the target by default', () => {
    expect(requiredMinutes(day(0), 70)).toBe(672);
    expect(qualifies(day(671), 70)).toBe(false);
    expect(qualifies(day(672), 70)).toBe(true);
  });

  it('counts a chain of qualified days ending today', () => {
    const records = {
      '2026-09-25': day(700),
      '2026-09-26': day(800),
      '2026-09-27': day(900),
    };
    const s = computeStreak(records, 70, '2026-09-27');
    expect(s.currentStreak).toBe(3);
    expect(s.todayQualified).toBe(true);
    expect(s.longestStreak).toBe(3);
  });

  it('keeps the streak alive when today is still pending', () => {
    const records = {
      '2026-09-25': day(700),
      '2026-09-26': day(800),
      '2026-09-27': day(100), // today, not qualified yet
    };
    const s = computeStreak(records, 70, '2026-09-27');
    expect(s.currentStreak).toBe(2); // ends yesterday
    expect(s.todayQualified).toBe(false);
    expect(s.todayPending).toBe(true);
    expect(s.atRisk).toBe(true);
    expect(s.minutesToKeepStreak).toBe(572); // 672 - 100
  });

  it('breaks on a gap day', () => {
    const records = {
      '2026-09-20': day(900),
      '2026-09-21': day(900),
      // 22nd missing entirely
      '2026-09-23': day(900),
      '2026-09-24': day(900),
      '2026-09-25': day(900),
      '2026-09-26': day(900),
      '2026-09-27': day(900),
    };
    const s = computeStreak(records, 70, '2026-09-27');
    expect(s.currentStreak).toBe(5);
    expect(s.longestStreak).toBe(5);
  });

  it('breaks on an under-target day, not just a missing one', () => {
    const records = {
      '2026-09-25': day(900),
      '2026-09-26': day(10),
      '2026-09-27': day(900),
    };
    const s = computeStreak(records, 70, '2026-09-27');
    expect(s.currentStreak).toBe(1);
    expect(s.longestStreak).toBe(1);
  });

  it('recalculates when the threshold changes', () => {
    const records = {
      '2026-09-26': day(500),
      '2026-09-27': day(500),
    };
    expect(computeStreak(records, 70, '2026-09-27').currentStreak).toBe(0);
    expect(computeStreak(records, 50, '2026-09-27').currentStreak).toBe(2);
  });

  it('tracks totals independently of the streak', () => {
    const records = {
      '2026-09-25': day(900),
      '2026-09-26': day(10),
      '2026-09-27': day(0),
    };
    const s = computeStreak(records, 70, '2026-09-27');
    expect(s.totalStudyDays).toBe(2);
    expect(s.totalMinutes).toBe(910);
  });

  it('handles an empty history', () => {
    const s = computeStreak({}, 70, '2026-09-27');
    expect(s.currentStreak).toBe(0);
    expect(s.longestStreak).toBe(0);
    expect(s.totalStudyDays).toBe(0);
  });
});
