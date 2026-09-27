# StudyLoop

**16 Hours. Every Day. Keep Building.**

An offline-first, single-user study tracker for a 16-hour daily study plan. Every number in the
app is derived from sessions you actually logged — there are no placeholder stats, no fake
buttons and no server. Your data lives in `localStorage` and never leaves the browser.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

Optional — enable AI daily quotes:

```bash
cp .env.example .env
# then set VITE_GEMINI_API_KEY=your_key_here
```

Without a key the app silently uses its 24 built-in fallback quotes. Nothing breaks.

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Watch mode |
| `npm run analyze` | Build + open the bundle treemap (`ANALYZE=1`) |

---

## What's in it

**17 routes**, all lazy-loaded with prefetch-on-intent (hover/focus), wrapped in an onboarding
guard, a route-level skeleton and an error boundary.

| Area | Pages |
| --- | --- |
| Daily | Dashboard, Today's Plan, Timer, Tasks |
| Trackers | DSA, System Design, .NET / C#, React Native, Projects, Interview Prep |
| Insights | Analytics, Calendar, Achievements |
| App | Settings, Welcome (onboarding), 404 |

Highlights:

- **Drift-free timer.** Elapsed time is *derived*, never accumulated:
  `elapsedMs = accumulatedMs + (isRunning ? Date.now() - lastResumedAt : 0)`. Verified to stay
  exact across 8 simulated hours. Survives refresh and tab crashes via 30-second checkpoints
  plus `visibilitychange` / `pagehide` flushes, and splits cleanly across midnight.
- **One timer at a time.** Starting a second subject raises a confirm-switch modal instead of
  silently double-counting.
- **Streaks** with a configurable qualifying threshold (default 70% of the daily target).
  Today stays "pending" rather than breaking the streak before the day is over.
- **14 achievements** evaluated from real metrics, each showing live progress toward the next tier.
- **Analytics** with weekly/monthly charts, a 26-week intensity heatmap and per-day drill-down.
- **Export / import** a JSON backup, with a validated preview before anything is overwritten.

---

## Architecture

```
src/
  components/     common · Layout · Timer · Dashboard · Tasks · Trackers · Analytics
  context/        StudyData · Timer · Theme · Toast   (four split providers)
  data/           seed data, catalogs, fallback quotes
  hooks/          progress, streak, heatmap, quote, pagination, …
  pages/          16 route components
  router/         route table + prefetch loaders
  services/       geminiService.js
  styles/         tokens.css · base.css
  utils/          pure logic: dates, progress, streaks, records, backup, migrations
  test/           16 Vitest files
```

**Why four contexts?** The timer publishes a 1 Hz tick. If that lived in the same provider as
study data, every second would re-render the whole dashboard. Instead `useTimerTick()` is
consumed *only* by the three live-readout components (`LiveHMS`, `LiveCompact`, `LiveMinutes`),
so the tick never reaches the rest of the tree.

**State.** A single `useReducer` over ~35 action types, initialised lazily by reading
`localStorage` synchronously — so there is no loading flash on boot. Writes are debounced 300 ms
per key, quota-safe (falls back to in-memory with a toast), namespaced under `sl_`, versioned,
and run through `migrate()` on load.

**Day records are derived.** `perSubject` / `completedMinutes` are always a pure function of the
session log, so deleting a session or importing a backup recomputes them from scratch.

---

## Performance

Measured on the production build:

| Budget | Target | Actual |
| --- | --- | --- |
| Initial JS (gzip) | ≤ 150 KB | **125.6 KB** |
| Largest route chunk (gzip) | — | 115.3 KB (`charts`, `/analytics` only) |
| CSS (gzip) | — | 8.4 KB |

`recharts` is confined to `components/Analytics/{WeeklyChart,MonthlyChart}.jsx`, which are
reached only through `lazy(() => import(…))` inside the Analytics page — so the 115 KB charting
bundle is never downloaded unless you open `/analytics`. Chart colours are passed as CSS custom
properties straight into the SVG, so theming works with no JS.

---

## Accessibility & responsive

WCAG 2.1 AA: single `contentinfo` / `main` / labelled `navigation` landmarks, visible focus
rings, `aria-valuenow` on every progress indicator, labelled modals with Escape-to-close and
focus trapping, and `prefers-reduced-motion` honoured. Layout works from 320 px to 4K, with a
bottom nav plus a "More" sheet on mobile.

Light / dark / system themes switch via `data-theme` on `<html>`, with an inline script in
`index.html` that applies the stored theme before first paint (no flash of wrong theme).

---

## Testing

```bash
npm test
```

**123 tests across 16 files**, covering:

- pure logic — progress clamping, time formatting, local-timezone date keys, streaks, day
  records, migrations, backup validation, the achievement evaluator, seed integrity
- the timer engine — drift over 8 hours, pause/resume, crash recovery, backwards clock jumps,
  midnight rollover
- the reducer — session append/delete, task toggles, subject reorder/delete, retargeting, import
- components — progress bars, rings, modals, empty states
- integration — onboarding redirect, footer credit, derived (not hardcoded) dashboard numbers,
  sidebar navigation, 404, full timer lifecycle, and a smoke test asserting **all 14 in-app
  routes render with zero console errors**

---

## Deploying

`vercel.json` already contains the SPA rewrite. Set `VITE_GEMINI_API_KEY` in your host's
environment variables if you want AI quotes, then:

```bash
npm run build     # -> dist/
```

Any static host works; just make sure unknown paths rewrite to `index.html`.

---

## Notes & constraints

- No component library, no `moment`, `lodash` or `axios` — native `fetch`, `Intl` and
  hand-written CSS only.
- The Gemini call uses `gemini-2.0-flash`, is cached once per day, allows 10 manual refreshes
  per day, and aborts after 8 s via `AbortController`, falling back to a local quote.
- Single-user by design: no auth, no sync, no backend.

---

Developed by Naveen
