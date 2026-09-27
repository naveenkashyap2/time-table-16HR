import { describe, it, expect } from 'vitest';
import { evaluateAchievements, buildAchievementStates } from '../utils/achievementsEngine.js';
import { ACHIEVEMENTS } from '../data/achievementsCatalog.js';

const base = {
  sessions: [], dailyRecords: {}, dsa: [], achievements: {},
  settings: { streakThresholdPercent: 70 },
};

describe('achievement engine', () => {
  it('unlocks nothing on a fresh install', () => {
    expect(evaluateAchievements(base)).toEqual([]);
  });

  it('unlocks the first session', () => {
    const state = { ...base, sessions: [{ id: 's1' }] };
    expect(evaluateAchievements(state)).toContain('first-session');
  });

  it('unlocks every daily-volume tier a perfect day crosses', () => {
    const state = {
      ...base,
      sessions: [{ id: 's1' }],
      dailyRecords: { '2026-09-27': { targetMinutes: 960, completedMinutes: 960 } },
    };
    const unlocked = evaluateAchievements(state);
    expect(unlocked).toEqual(
      expect.arrayContaining(['day-5h', 'day-8h', 'day-12h', 'day-16h']),
    );
  });

  it('does not re-unlock what is already unlocked', () => {
    const state = {
      ...base,
      sessions: [{ id: 's1' }],
      achievements: { 'first-session': '2026-09-01T00:00:00.000Z' },
    };
    expect(evaluateAchievements(state)).not.toContain('first-session');
  });

  it('unlocks DSA milestones from solved problems', () => {
    const dsa = Array.from({ length: 50 }, (_, i) => ({ id: `p${i}`, status: 'solved' }));
    const unlocked = evaluateAchievements({ ...base, dsa });
    expect(unlocked).toContain('dsa-50');
    expect(unlocked).not.toContain('dsa-100');
  });

  it('reports progress for locked achievements', () => {
    const dsa = Array.from({ length: 25 }, (_, i) => ({ id: `p${i}`, status: 'solved' }));
    const { items, unlockedCount, total, next } = buildAchievementStates({ ...base, dsa });
    const dsa50 = items.find((i) => i.id === 'dsa-50');
    expect(dsa50.unlocked).toBe(false);
    expect(dsa50.percent).toBe(50);
    expect(total).toBe(ACHIEVEMENTS.length);
    expect(unlockedCount).toBe(0);
    expect(next).toBeTruthy();
  });

  it('has exactly 14 achievements with unique ids', () => {
    expect(ACHIEVEMENTS).toHaveLength(14);
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(14);
  });
});
