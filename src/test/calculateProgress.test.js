import { describe, it, expect } from 'vitest';
import {
  calculateProgress, calculatePercent, rawPercent, remainingMinutes, percentInt,
} from '../utils/calculateProgress.js';

describe('calculateProgress', () => {
  it('computes a normal partial day', () => {
    const p = calculateProgress(480, 960);
    expect(p.percent).toBe(50);
    expect(p.remaining).toBe(480);
    expect(p.isComplete).toBe(false);
  });

  it('clamps the DISPLAY percentage at 100 but preserves real minutes', () => {
    const p = calculateProgress(1200, 960);
    expect(p.percent).toBe(100);
    expect(p.percentInt).toBe(100);
    expect(p.rawPercent).toBeCloseTo(125);
    expect(p.completed).toBe(1200);
    expect(p.isOver).toBe(true);
    expect(p.overBy).toBe(240);
  });

  it('never returns a negative remaining', () => {
    expect(remainingMinutes(1200, 960)).toBe(0);
    expect(remainingMinutes(-50, 960)).toBe(960);
  });

  it('is zero-target safe (no division by zero)', () => {
    expect(rawPercent(100, 0)).toBe(0);
    expect(calculatePercent(100, 0)).toBe(0);
    const p = calculateProgress(100, 0);
    expect(p.percent).toBe(0);
    expect(p.isComplete).toBe(false);
  });

  it('handles garbage input without throwing', () => {
    expect(percentInt(undefined, undefined)).toBe(0);
    expect(percentInt(NaN, 960)).toBe(0);
    expect(calculateProgress(null, null).percent).toBe(0);
  });

  it('treats exactly hitting the target as complete', () => {
    const p = calculateProgress(960, 960);
    expect(p.isComplete).toBe(true);
    expect(p.isOver).toBe(false);
    expect(p.remaining).toBe(0);
  });
});
