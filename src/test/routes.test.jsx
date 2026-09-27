import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { K, saveDataNow } from '../utils/storage.js';
import { buildSeedState } from '../data/seed.js';
import { todayKey } from '../utils/dateUtils.js';

function seedInstall() {
  const s = buildSeedState({ onboarded: true, userName: 'Naveen' });
  const subjectId = s.subjects[0].id;
  saveDataNow(K.SETTINGS, { ...s.settings, userName: 'Naveen', onboarded: true });
  saveDataNow(K.SUBJECTS, s.subjects);
  saveDataNow(K.TASKS, s.tasks);
  // a little real history so charts/heatmaps/calendars have something to draw
  saveDataNow(K.SESSIONS, [
    { id: 's1', subjectId, dateKey: todayKey(), startAt: 0, endAt: 3_600_000, durationMs: 3_600_000, source: 'timer' },
  ]);
  saveDataNow(K.DAILY_RECORDS, {
    ...s.dailyRecords,
    [todayKey()]: {
      dateKey: todayKey(), targetMinutes: 960, completedMinutes: 60,
      perSubject: { [subjectId]: 60 }, updatedAt: Date.now(),
    },
  });
  saveDataNow(K.DSA, s.dsa);
  saveDataNow(K.PROJECTS, s.projects);
  saveDataNow(K.INTERVIEW, s.interview);
  saveDataNow(K.SD_TOPICS, s.sdTopics);
  saveDataNow(K.DOTNET_TOPICS, s.dotnetTopics);
  saveDataNow(K.RN_TOPICS, s.rnTopics);
  saveDataNow(K.ACHIEVEMENTS, {});
  saveDataNow(K.SCHEMA, 2);
}

const ROUTES = [
  ['/', /Naveen/i],
  ['/plan', /Today.?s Plan/i],
  ['/timer', /Study Timer/i],
  ['/tasks', /Tasks/i],
  ['/dsa', /DSA/i],
  ['/system-design', /System Design/i],
  ['/dotnet', /\.NET/i],
  ['/react-native', /React Native/i],
  ['/projects', /Projects/i],
  ['/interview', /Interview/i],
  ['/analytics', /Analytics/i],
  ['/calendar', /Calendar/i],
  ['/achievements', /Achievements/i],
  ['/settings', /Settings/i],
];

describe('every route renders without crashing', () => {
  let errorSpy;

  beforeEach(async () => {
    vi.useRealTimers();
    await new Promise((r) => { setTimeout(r, 350); });
    localStorage.clear();
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => errorSpy.mockRestore());

  it.each(ROUTES)('%s renders its page heading', async (path, heading) => {
    seedInstall();
    window.history.pushState({}, '', path);
    vi.resetModules();
    const { default: App } = await import('../App.jsx');
    render(<App />);

    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();

    // no error boundary fallback, and nothing logged to console.error
    expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
    const realErrors = errorSpy.mock.calls.filter(
      (c) => !String(c[0]).includes('not wrapped in act'),
    );
    expect(realErrors).toEqual([]);
  });
});
