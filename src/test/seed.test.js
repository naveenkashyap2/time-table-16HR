import { describe, it, expect } from 'vitest';
import { buildSeedState } from '../data/seed.js';
import { DEFAULT_SUBJECTS, TOTAL_SEED_MINUTES } from '../data/defaultSubjects.js';
import { FALLBACK_QUOTES } from '../data/fallbackQuotes.js';
import { SYSTEM_DESIGN_TOPICS } from '../data/systemDesignTopics.js';
import { DOTNET_TOPICS } from '../data/dotnetTopics.js';
import { REACT_NATIVE_TOPICS } from '../data/reactNativeTopics.js';
import { INTERVIEW_CATEGORIES } from '../data/interviewCategories.js';
import { DSA_TOPICS } from '../data/dsaTopics.js';
import { todayKey } from '../utils/dateUtils.js';

describe('seed data (§16)', () => {
  it('sums to exactly 960 minutes', () => {
    expect(TOTAL_SEED_MINUTES).toBe(960);
    expect(DEFAULT_SUBJECTS.reduce((s, x) => s + x.targetMinutes, 0)).toBe(960);
  });

  it('keeps sub-block totals within their subject target', () => {
    DEFAULT_SUBJECTS.forEach((s) => {
      const sub = (s.subBlocks || []).reduce((a, b) => a + b.targetMinutes, 0);
      if (sub > 0) expect(sub).toBeLessThanOrEqual(s.targetMinutes);
    });
  });

  it('ships the exact dataset counts the PRD asks for', () => {
    expect(DSA_TOPICS).toHaveLength(16);
    expect(SYSTEM_DESIGN_TOPICS).toHaveLength(22);
    expect(DOTNET_TOPICS).toHaveLength(15);
    expect(REACT_NATIVE_TOPICS).toHaveLength(13);
    expect(INTERVIEW_CATEGORIES).toHaveLength(14);
    expect(FALLBACK_QUOTES).toHaveLength(24);
  });

  it('builds a complete, internally consistent first-launch state', () => {
    const s = buildSeedState({ onboarded: true, userName: 'Naveen' });
    expect(s.settings.dailyTargetMinutes).toBe(960);
    expect(s.settings.userName).toBe('Naveen');
    expect(s.subjects).toHaveLength(7);
    expect(s.sessions).toHaveLength(0);
    expect(s.dailyRecords[todayKey()]).toBeTruthy();
    expect(s.dailyRecords[todayKey()].targetMinutes).toBe(960);
    expect(s.projects).toHaveLength(6);
    expect(s.dsa.length).toBeGreaterThan(20);
    expect(Object.keys(s.achievements)).toHaveLength(0);

    // every task points at a real subject
    const ids = new Set(s.subjects.map((x) => x.id));
    s.tasks.forEach((t) => expect(ids.has(t.subjectId)).toBe(true));

    // ids are unique
    expect(new Set(s.subjects.map((x) => x.id)).size).toBe(7);
  });
});
