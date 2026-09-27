import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { K, saveDataNow } from '../utils/storage.js';
import { buildSeedState } from '../data/seed.js';
import { todayKey } from '../utils/dateUtils.js';

/**
 * `router/index.jsx` creates the browser router at module scope, so its
 * location would leak between tests. Reset the module registry AND the jsdom
 * URL before each mount so every test boots a genuinely fresh app.
 */
async function mountAt(path = '/') {
  window.history.pushState({}, '', path);
  vi.resetModules();
  const { default: App } = await import('../App.jsx');
  return render(<App />);
}

/** Persist a seeded, already-onboarded install so the app boots to the Dashboard. */
function seedInstall(extra = {}) {
  const s = buildSeedState({ onboarded: true, userName: 'Naveen' });
  const merged = { ...s, ...extra };
  saveDataNow(K.SETTINGS, { ...merged.settings, userName: 'Naveen', onboarded: true });
  saveDataNow(K.SUBJECTS, merged.subjects);
  saveDataNow(K.TASKS, merged.tasks);
  saveDataNow(K.SESSIONS, merged.sessions);
  saveDataNow(K.DAILY_RECORDS, merged.dailyRecords);
  saveDataNow(K.DSA, merged.dsa);
  saveDataNow(K.PROJECTS, merged.projects);
  saveDataNow(K.INTERVIEW, merged.interview);
  saveDataNow(K.SD_TOPICS, merged.sdTopics);
  saveDataNow(K.DOTNET_TOPICS, merged.dotnetTopics);
  saveDataNow(K.RN_TOPICS, merged.rnTopics);
  saveDataNow(K.ACHIEVEMENTS, merged.achievements);
  saveDataNow(K.SCHEMA, 2);
  return merged;
}

describe('App shell', () => {
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

  it('redirects a brand-new install to onboarding', async () => {
    await mountAt('/');
    expect(await screen.findByText(/16 Hours\. Every Day\. Keep Building\./i))
      .toBeInTheDocument();
  });

  it('boots an onboarded install straight to the Dashboard', async () => {
    seedInstall();
    await mountAt('/');
    expect(await screen.findByRole('heading', { level: 1, name: /Naveen/i }))
      .toBeInTheDocument();
  });

  it('renders the footer credit exactly once, with no copyright line', async () => {
    seedInstall();
    await mountAt('/');
    await screen.findByRole('heading', { level: 1, name: /Naveen/i });
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByText('Developed by Naveen')).toBeInTheDocument();
    expect(footer.textContent).not.toMatch(/©|copyright|all rights reserved/i);
  });

  it('derives displayed stats from stored sessions, not hardcoded values', async () => {
    const seeded = buildSeedState({ onboarded: true, userName: 'Naveen' });
    const subjectId = seeded.subjects[0].id;
    seedInstall({
      sessions: [{
        id: 's1', subjectId, dateKey: todayKey(),
        startAt: 0, endAt: 14_400_000, durationMs: 14_400_000, source: 'timer',
      }],
      dailyRecords: {
        [todayKey()]: {
          dateKey: todayKey(), targetMinutes: 960, completedMinutes: 240,
          perSubject: { [subjectId]: 240 }, updatedAt: Date.now(),
        },
      },
    });
    await mountAt('/');
    await screen.findByRole('heading', { level: 1, name: /Naveen/i });

    // 240 of 960 minutes => "4h" studied, exactly 25%, 12h remaining.
    expect((await screen.findAllByText('4h')).length).toBeGreaterThan(0);
    expect(
      screen.getByRole('img', { name: /25 percent of today's target completed/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/12h/).length).toBeGreaterThan(0);
  });

  it('navigates to another route from the sidebar', async () => {
    const user = userEvent.setup();
    seedInstall();
    await mountAt('/');
    await screen.findByRole('heading', { level: 1, name: /Naveen/i });

    const sidebar = screen.getByRole('navigation', { name: /main/i });
    await user.click(within(sidebar).getByRole('link', { name: /Achievements/i }));

    expect(await screen.findByRole('heading', { level: 1, name: /Achievements/i }))
      .toBeInTheDocument();
  });

  it('renders the 404 page for an unknown route', async () => {
    seedInstall();
    await mountAt('/definitely-not-a-route');
    expect(await screen.findByText('404')).toBeInTheDocument();
  });

  it('keeps the onboarding guard away from an onboarded user', async () => {
    seedInstall();
    await mountAt('/');
    await screen.findByRole('heading', { level: 1, name: /Naveen/i });
    expect(screen.queryByText(/16 Hours\. Every Day\. Keep Building\./i)).not.toBeInTheDocument();
  });
});
