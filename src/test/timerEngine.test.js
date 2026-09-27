import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { computeElapsed } from '../context/TimerContext.jsx';
import { endOfDayMs, toDateKey } from '../utils/dateUtils.js';
import { msToMinutes } from '../utils/formatTime.js';

/**
 * The timer engine is timestamp-derived (§9.2), so the maths can be verified
 * exactly with a mocked clock — no drift is possible by construction.
 */
describe('timer engine — elapsed math', () => {
  const T0 = new Date(2026, 8, 27, 10, 0, 0).getTime();

  beforeEach(() => vi.useFakeTimers({ now: T0 }));
  afterEach(() => vi.useRealTimers());

  it('returns 0 for no session', () => {
    expect(computeElapsed(null)).toBe(0);
  });

  it('accumulates while running', () => {
    const s = { accumulatedMs: 0, lastResumedAt: T0, isRunning: true };
    expect(computeElapsed(s, T0 + 5000)).toBe(5000);
    expect(computeElapsed(s, T0 + 3_600_000)).toBe(3_600_000);
  });

  it('freezes while paused', () => {
    const paused = { accumulatedMs: 120_000, lastResumedAt: T0, isRunning: false };
    expect(computeElapsed(paused, T0 + 999_999)).toBe(120_000);
  });

  it('resumes from the accumulated total', () => {
    const resumed = { accumulatedMs: 120_000, lastResumedAt: T0, isRunning: true };
    expect(computeElapsed(resumed, T0 + 60_000)).toBe(180_000);
  });

  it('does not drift over 8 hours of wall clock', () => {
    const EIGHT_H = 8 * 3600 * 1000;
    const s = { accumulatedMs: 0, lastResumedAt: T0, isRunning: true };
    // Simulate 28 800 one-second ticks: the value is DERIVED, never summed.
    for (let i = 1; i <= 28_800; i += 1) {
      vi.advanceTimersByTime(1000);
    }
    const elapsed = computeElapsed(s, T0 + EIGHT_H);
    expect(Math.abs(elapsed - EIGHT_H)).toBeLessThan(1000); // < 1s (§1)
    expect(elapsed).toBe(EIGHT_H);
  });

  it('survives a simulated crash: elapsed is recomputed from timestamps', () => {
    // Session started 90 minutes ago, tab was killed, app reloads now.
    const startedAt = T0 - 90 * 60_000;
    const restored = { accumulatedMs: 0, lastResumedAt: startedAt, isRunning: true };
    expect(msToMinutes(computeElapsed(restored, T0))).toBe(90);
  });

  it('clamps a clock that jumped backwards', () => {
    const s = { accumulatedMs: 60_000, lastResumedAt: T0, isRunning: true };
    expect(computeElapsed(s, T0 - 10_000)).toBe(60_000);
  });
});

describe('timer engine — midnight rollover', () => {
  it('splits the session exactly at 23:59:59.999 and continues on the new day', () => {
    const dayA = '2026-09-27';
    const startedAt = new Date(2026, 8, 27, 23, 30, 0).getTime();
    const boundary = endOfDayMs(dayA);

    const session = { accumulatedMs: 0, lastResumedAt: startedAt, isRunning: true, dateKey: dayA };

    // Part 1: what gets committed to 27 Sep.
    const untilMidnight = computeElapsed(session, boundary);
    expect(msToMinutes(untilMidnight)).toBe(29); // 23:30:00 → 23:59:59.999

    // Part 2: the timer keeps running on 28 Sep from boundary + 1ms.
    const resumeAt = boundary + 1;
    expect(toDateKey(new Date(resumeAt))).toBe('2026-09-28');

    const afterMidnight = computeElapsed(
      { accumulatedMs: 0, lastResumedAt: resumeAt, isRunning: true, dateKey: '2026-09-28' },
      resumeAt + 15 * 60_000,
    );
    expect(msToMinutes(afterMidnight)).toBe(15);

    // Nothing is lost: 29 + 15 = 44 minutes of a 45-minute stretch (1s rounding).
    expect(msToMinutes(untilMidnight) + msToMinutes(afterMidnight)).toBe(44);
  });
});
