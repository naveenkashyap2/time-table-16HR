import { describe, it, expect } from 'vitest';
import {
  toDateKey, fromDateKey, isValidDateKey, endOfDayMs, addDayKey, diffDays,
  startOfWeek, rangeKeys, dayOfYear, greetingFor, lastNKeys,
} from '../utils/dateUtils.js';

describe('dateUtils', () => {
  it('builds LOCAL date keys, not UTC ones', () => {
    // 1 Jan 2026 at 00:30 local — toISOString() would report 2025-12-31 in IST.
    const d = new Date(2026, 0, 1, 0, 30, 0);
    expect(toDateKey(d)).toBe('2026-01-01');
  });

  it('round-trips a date key', () => {
    expect(toDateKey(fromDateKey('2026-09-27'))).toBe('2026-09-27');
  });

  it('validates date keys', () => {
    expect(isValidDateKey('2026-09-27')).toBe(true);
    expect(isValidDateKey('2026-13-01')).toBe(false);
    expect(isValidDateKey('2026-02-30')).toBe(false);
    expect(isValidDateKey('nope')).toBe(false);
  });

  it('computes local end of day', () => {
    const ms = endOfDayMs('2026-09-27');
    const d = new Date(ms);
    expect(d.getHours()).toBe(23);
    expect(d.getMinutes()).toBe(59);
    expect(d.getSeconds()).toBe(59);
    expect(toDateKey(d)).toBe('2026-09-27');
  });

  it('adds days across a month boundary', () => {
    expect(addDayKey('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDayKey('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('diffs days correctly across DST-ish boundaries', () => {
    expect(diffDays('2026-09-28', '2026-09-27')).toBe(1);
    expect(diffDays('2026-10-01', '2026-09-30')).toBe(1);
    expect(diffDays('2026-09-27', '2026-09-27')).toBe(0);
  });

  it('starts the week on the configured day', () => {
    const sunday = new Date(2026, 8, 27); // 27 Sep 2026 is a Sunday
    expect(toDateKey(startOfWeek(sunday, 1))).toBe('2026-09-21'); // Monday
    expect(toDateKey(startOfWeek(sunday, 0))).toBe('2026-09-27'); // Sunday
  });

  it('produces inclusive ranges', () => {
    const keys = rangeKeys(new Date(2026, 8, 25), new Date(2026, 8, 27));
    expect(keys).toEqual(['2026-09-25', '2026-09-26', '2026-09-27']);
  });

  it('returns the last N keys ending today', () => {
    const keys = lastNKeys(3, new Date(2026, 8, 27));
    expect(keys).toEqual(['2026-09-25', '2026-09-26', '2026-09-27']);
  });

  it('computes day of year', () => {
    expect(dayOfYear(new Date(2026, 0, 1))).toBe(1);
    expect(dayOfYear(new Date(2026, 11, 31))).toBe(365);
  });

  it('greets by hour', () => {
    expect(greetingFor(8)).toBe('Good morning');
    expect(greetingFor(14)).toBe('Good afternoon');
    expect(greetingFor(19)).toBe('Good evening');
    expect(greetingFor(2)).toBe('Good night');
  });
});
