import { describe, it, expect } from 'vitest';
import {
  formatMinutes, formatHHMM, formatHMS, msToMinutes, minutesToMs, toHours, formatDurationMs,
} from '../utils/formatTime.js';

describe('formatTime', () => {
  it('formats minutes as Xh Ym', () => {
    expect(formatMinutes(0)).toBe('0m');
    expect(formatMinutes(45)).toBe('45m');
    expect(formatMinutes(60)).toBe('1h');
    expect(formatMinutes(615)).toBe('10h 15m');
    expect(formatMinutes(960)).toBe('16h');
  });

  it('formats HH:MM clock style', () => {
    expect(formatHHMM(0)).toBe('00:00');
    expect(formatHHMM(615)).toBe('10:15');
    expect(formatHHMM(960)).toBe('16:00');
  });

  it('formats HH:MM:SS for the timer, past 24h', () => {
    expect(formatHMS(0)).toBe('00:00:00');
    expect(formatHMS(1000)).toBe('00:00:01');
    expect(formatHMS(3_661_000)).toBe('01:01:01');
    expect(formatHMS(90_000_000)).toBe('25:00:00');
  });

  it('is negative-safe everywhere', () => {
    expect(formatMinutes(-30)).toBe('0m');
    expect(formatHHMM(-30)).toBe('00:00');
    expect(formatHMS(-5000)).toBe('00:00:00');
    expect(msToMinutes(-1)).toBe(0);
    expect(minutesToMs(-1)).toBe(0);
    expect(toHours(-60)).toBe(0);
  });

  it('round-trips minutes and milliseconds', () => {
    expect(msToMinutes(minutesToMs(137))).toBe(137);
  });

  it('formats short durations in seconds', () => {
    expect(formatDurationMs(38_000)).toBe('38s');
    expect(formatDurationMs(5_040_000)).toBe('1h 24m');
  });
});
