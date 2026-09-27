import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { K, saveDataNow, loadData } from '../utils/storage.js';
import { buildSeedState } from '../data/seed.js';
import { todayKey } from '../utils/dateUtils.js';

function seedInstall() {
  const s = buildSeedState({ onboarded: true, userName: 'Naveen' });
  saveDataNow(K.SETTINGS, { ...s.settings, userName: 'Naveen', onboarded: true });
  saveDataNow(K.SUBJECTS, s.subjects);
  saveDataNow(K.TASKS, s.tasks);
  saveDataNow(K.SESSIONS, []);
  saveDataNow(K.DAILY_RECORDS, s.dailyRecords);
  saveDataNow(K.DSA, s.dsa);
  saveDataNow(K.PROJECTS, s.projects);
  saveDataNow(K.INTERVIEW, s.interview);
  saveDataNow(K.SD_TOPICS, s.sdTopics);
  saveDataNow(K.DOTNET_TOPICS, s.dotnetTopics);
  saveDataNow(K.RN_TOPICS, s.rnTopics);
  saveDataNow(K.ACHIEVEMENTS, {});
  saveDataNow(K.SCHEMA, 2);
  return s;
}

async function mountTimer() {
  window.history.pushState({}, '', '/timer');
  vi.resetModules();
  const { default: App } = await import('../App.jsx');
  return render(<App />);
}

describe('Timer page — end-to-end session lifecycle', () => {
  /**
   * Each mount gets its own storage module instance (vi.resetModules), so a
   * debounced 300ms write scheduled by the PREVIOUS test's app can still be
   * in flight. Let it land, then wipe — otherwise it clobbers this test's seed.
   */
  beforeEach(async () => {
    vi.useRealTimers();
    await new Promise((r) => { setTimeout(r, 350); });
    localStorage.clear();
  });
  afterEach(() => vi.useRealTimers());

  it('starts a session, counts up drift-free, and commits it on stop', async () => {
    seedInstall();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await mountTimer();

    const dsaBtn = await screen.findByRole('button', { name: /DSA/ });
    expect(screen.getAllByText('00:00:00').length).toBeGreaterThan(0);

    // picking a subject starts that subject's timer
    await user.click(dsaBtn);

    const active = loadData(K.ACTIVE_SESSION, null);
    expect(active).toBeTruthy();
    expect(active.isRunning).toBe(true);
    expect(active.dateKey).toBe(todayKey());
    expect(active.accumulatedMs).toBe(0);

    // 90s of wall clock; the display is re-derived from timestamps each tick
    await act(async () => {
      vi.advanceTimersByTime(90_000);
    });
    expect(screen.getAllByText('00:01:30').length).toBeGreaterThan(0);

    // stop -> session committed to the log, active slot cleared
    await user.click(screen.getAllByRole('button', { name: /stop and save session/i })[0]);
    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    const sessions = loadData(K.SESSIONS, []);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].subjectId).toBe(active.subjectId);
    expect(sessions[0].durationMs).toBeGreaterThanOrEqual(90_000);
    expect(sessions[0].dateKey).toBe(todayKey());
    expect(loadData(K.ACTIVE_SESSION, null)).toBeNull();
  });

  it('recovers a running session after a simulated crash/refresh', async () => {
    const s = seedInstall();
    const subjectId = s.subjects[0].id;
    const ninetyMinAgo = Date.now() - 90 * 60_000;

    // a session that was running when the tab died
    saveDataNow(K.ACTIVE_SESSION, {
      id: 'recovered',
      subjectId,
      dateKey: todayKey(),
      startedAt: ninetyMinAgo,
      lastResumedAt: ninetyMinAgo,
      accumulatedMs: 0,
      isRunning: true,
    });

    await mountTimer();

    // 90 minutes are reconstructed purely from the stored timestamps
    expect(await screen.findByText(/01:30:0\d/)).toBeInTheDocument();
  });

  it('restores a PAUSED session without advancing it', async () => {
    const s = seedInstall();
    saveDataNow(K.ACTIVE_SESSION, {
      id: 'paused',
      subjectId: s.subjects[0].id,
      dateKey: todayKey(),
      startedAt: Date.now() - 60 * 60_000,
      lastResumedAt: Date.now() - 60 * 60_000,
      accumulatedMs: 25 * 60_000,
      isRunning: false,
    });

    await mountTimer();
    expect(await screen.findByText('00:25:00')).toBeInTheDocument();
  });

  it('enforces one timer at a time with a confirmation modal', async () => {
    const s = seedInstall();
    const user = userEvent.setup();
    saveDataNow(K.ACTIVE_SESSION, {
      id: 'running',
      subjectId: s.subjects[0].id,
      dateKey: todayKey(),
      startedAt: Date.now() - 10 * 60_000,
      lastResumedAt: Date.now() - 10 * 60_000,
      accumulatedMs: 0,
      isRunning: true,
    });

    await mountTimer();
    await screen.findByText(/00:10:0\d/);

    // try to start a DIFFERENT subject from the subject switcher
    const otherName = s.subjects[1].name;
    const otherBtn = await screen.findByRole('button', { name: new RegExp(otherName, 'i') });
    await user.click(otherBtn);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/switch/i)).toBeInTheDocument();
  });
});
