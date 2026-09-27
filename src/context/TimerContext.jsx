import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { K, loadData, saveDataNow, removeData } from '../utils/storage.js';
import { todayKey, endOfDayMs } from '../utils/dateUtils.js';
import { uid } from '../utils/id.js';
import { formatDurationMs } from '../utils/formatTime.js';
import { useStudy, useStudyActions } from './StudyContext.jsx';
import { useToast } from './ToastContext.jsx';

/* =========================================================================
 * TimerContext — PRD §9.2, timestamp-based, drift-free.
 *
 *   elapsedMs = accumulatedMs + (isRunning ? Date.now() - lastResumedAt : 0)
 *
 * Contexts are split so the 1 Hz tick can NEVER re-render the app tree:
 *   • TimerStateContext   → activeSession meta   (changes on user action)
 *   • TimerActionsContext → stable action object (never changes)
 *   • TimerTickContext    → elapsedMs at 1 Hz    (timer UI only)
 * ========================================================================= */

const TimerStateContext = createContext(null);
const TimerActionsContext = createContext(null);
const TimerTickContext = createContext(0);

const CHECKPOINT_MS = 30_000; // §9.2 — 30 s crash-recovery checkpoints

/** Pure elapsed computation — exported for tests. */
export function computeElapsed(session, now = Date.now()) {
  if (!session) return 0;
  const acc = Math.max(0, Number(session.accumulatedMs) || 0);
  if (!session.isRunning) return acc;
  const since = now - (Number(session.lastResumedAt) || now);
  return acc + Math.max(0, since);
}

function readStoredSession() {
  const s = loadData(K.ACTIVE_SESSION, null);
  if (!s || typeof s !== 'object' || !s.subjectId) return null;
  return {
    subjectId: s.subjectId,
    accumulatedMs: Math.max(0, Number(s.accumulatedMs) || 0),
    lastResumedAt: Number(s.lastResumedAt) || Date.now(),
    startedAt: Number(s.startedAt) || Date.now(),
    isRunning: Boolean(s.isRunning),
    dateKey: s.dateKey || todayKey(),
  };
}

function sessionReducer(state, action) {
  switch (action.type) {
    case 'START':
      return {
        subjectId: action.subjectId,
        accumulatedMs: 0,
        lastResumedAt: action.now,
        startedAt: action.now,
        isRunning: true,
        dateKey: todayKey(),
      };
    case 'PAUSE':
      if (!state || !state.isRunning) return state;
      return {
        ...state,
        accumulatedMs: computeElapsed(state, action.now),
        lastResumedAt: action.now,
        isRunning: false,
      };
    case 'RESUME':
      if (!state || state.isRunning) return state;
      return { ...state, lastResumedAt: action.now, isRunning: true };
    case 'ROLL': // midnight rollover — keep running on the new day
      return {
        ...state,
        accumulatedMs: 0,
        startedAt: action.now,
        lastResumedAt: action.now,
        dateKey: action.dateKey,
      };
    case 'CLEAR':
      return null;
    default:
      return state;
  }
}

export function TimerProvider({ children }) {
  const { subjects, settings } = useStudy();
  const { appendSession, addNotification } = useStudyActions();
  const toast = useToast();

  const [session, dispatchSession] = useReducer(sessionReducer, null, readStoredSession);
  const [tick, setTick] = useState(() => computeElapsed(readStoredSession()));

  /** Pending "start X after stopping Y" confirmation (§9.2 one-timer rule). */
  const [pendingSwitch, setPendingSwitch] = useState(null);

  const sessionRef = useRef(session);
  sessionRef.current = session;

  const subjectsRef = useRef(subjects);
  subjectsRef.current = subjects;

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const subjectName = useCallback(
    (id) => subjectsRef.current.find((s) => s.id === id)?.name || 'Unknown subject',
    [],
  );

  /* ---- Persist the active session (start/pause/resume/stop) ----------- */
  const persistSession = useCallback((s) => {
    if (s) saveDataNow(K.ACTIVE_SESSION, s);
    else removeData(K.ACTIVE_SESSION);
  }, []);

  useEffect(() => {
    persistSession(session);
  }, [session, persistSession]);

  /* ---- Commit a finished stretch of time to the study log ------------- */
  const commit = useCallback(
    (s, endAt, durationMs) => {
      if (!s || durationMs <= 0) return null;
      const record = {
        id: uid('ses'),
        subjectId: s.subjectId,
        dateKey: s.dateKey,
        startAt: s.startedAt,
        endAt,
        durationMs,
        source: 'timer',
      };
      appendSession(record);
      return record;
    },
    [appendSession],
  );

  /* ---- Recovery on load (§9.2) ---------------------------------------- *
   * Elapsed is recomputed purely from timestamps, so a refresh, a closed
   * tab or a crash loses nothing. If the stored subject no longer exists
   * the session is parked and the user is prompted (§13).                */
  const recovered = useRef(false);
  useEffect(() => {
    if (recovered.current) return;
    recovered.current = true;
    const s = sessionRef.current;
    if (!s) return;

    const known = subjectsRef.current.some((x) => x.id === s.subjectId);
    if (!known) {
      toast.error(
        'Timer could not be restored',
        'The subject for the running session no longer exists. The session was discarded.',
      );
      dispatchSession({ type: 'CLEAR' });
      return;
    }
    if (s.isRunning) {
      toast.info('Timer restored', `${subjectName(s.subjectId)} is still running.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- The single 1 Hz interval in the whole app ---------------------- */
  useEffect(() => {
    if (!session?.isRunning) {
      setTick(computeElapsed(session));
      return undefined;
    }

    let lastCheckpoint = Date.now();

    const run = () => {
      const now = Date.now();
      const s = sessionRef.current;
      if (!s) return;

      /* --- Midnight rollover while running (§9.2) --- */
      const nowKey = todayKey();
      if (nowKey !== s.dateKey) {
        const boundary = endOfDayMs(s.dateKey);
        const untilMidnight = computeElapsed(s, boundary);
        commit(s, boundary, untilMidnight);
        const resumeAt = boundary + 1;
        dispatchSession({ type: 'ROLL', now: resumeAt, dateKey: nowKey });
        setTick(Math.max(0, now - resumeAt));
        lastCheckpoint = now;
        return;
      }

      setTick(computeElapsed(s, now));

      /* --- 30 s checkpoint (§9.2 / §10.2) --- */
      if (now - lastCheckpoint >= CHECKPOINT_MS) {
        lastCheckpoint = now;
        saveDataNow(K.ACTIVE_SESSION, { ...s, accumulatedMs: computeElapsed(s, now), lastResumedAt: now });
      }
    };

    run();
    const id = setInterval(run, 1000);
    return () => clearInterval(id);
  }, [session, commit]);

  /* ---- Checkpoint when the tab is hidden / unloaded -------------------- */
  useEffect(() => {
    const checkpoint = () => {
      const s = sessionRef.current;
      if (!s) return;
      const now = Date.now();
      saveDataNow(K.ACTIVE_SESSION, {
        ...s,
        accumulatedMs: computeElapsed(s, now),
        lastResumedAt: now,
      });
    };
    document.addEventListener('visibilitychange', checkpoint);
    window.addEventListener('pagehide', checkpoint);
    return () => {
      document.removeEventListener('visibilitychange', checkpoint);
      window.removeEventListener('pagehide', checkpoint);
    };
  }, []);

  /* ===================== actions ====================== */

  const stop = useCallback(
    (opts = {}) => {
      const s = sessionRef.current;
      if (!s) return null;
      const now = Date.now();
      const durationMs = computeElapsed(s, now);
      const record = commit(s, now, durationMs);
      dispatchSession({ type: 'CLEAR' });
      removeData(K.ACTIVE_SESSION);

      if (record && !opts.silent) {
        const name = subjectName(s.subjectId);
        toast.success(
          'Session completed',
          `${name} session completed — ${formatDurationMs(durationMs)}`,
        );
        if (settingsRef.current?.notifications?.sessionComplete) {
          addNotification({
            kind: 'session',
            title: 'Session completed',
            body: `${name} — ${formatDurationMs(durationMs)}`,
          });
        }
      } else if (!record && !opts.silent) {
        toast.info('Session discarded', 'Less than a minute was tracked.');
      }
      return record;
    },
    [commit, subjectName, toast, addNotification],
  );

  const start = useCallback(
    (subjectId, opts = {}) => {
      const current = sessionRef.current;

      // PRD §9.2 — one timer at a time.
      if (current && current.subjectId !== subjectId && !opts.force) {
        setPendingSwitch({ subjectId, fromSubjectId: current.subjectId });
        return false;
      }
      if (current && current.subjectId === subjectId) {
        if (!current.isRunning) dispatchSession({ type: 'RESUME', now: Date.now() });
        return true;
      }
      if (current && opts.force) stop({ silent: false });

      dispatchSession({ type: 'START', subjectId, now: Date.now() });
      if (!opts.quiet) {
        toast.info('Session started', `Tracking ${subjectName(subjectId)} now.`);
      }
      return true;
    },
    [stop, subjectName, toast],
  );

  const pause = useCallback(() => {
    if (!sessionRef.current?.isRunning) return;
    dispatchSession({ type: 'PAUSE', now: Date.now() });
  }, []);

  const resume = useCallback(() => {
    if (!sessionRef.current || sessionRef.current.isRunning) return;
    dispatchSession({ type: 'RESUME', now: Date.now() });
  }, []);

  const toggle = useCallback(() => {
    const s = sessionRef.current;
    if (!s) return;
    if (s.isRunning) dispatchSession({ type: 'PAUSE', now: Date.now() });
    else dispatchSession({ type: 'RESUME', now: Date.now() });
  }, []);

  /** Discard the running session without writing it to history. */
  const reset = useCallback(() => {
    dispatchSession({ type: 'CLEAR' });
    removeData(K.ACTIVE_SESSION);
    setTick(0);
  }, []);

  const confirmSwitch = useCallback(() => {
    const p = pendingSwitch;
    setPendingSwitch(null);
    if (!p) return;
    stop();
    dispatchSession({ type: 'START', subjectId: p.subjectId, now: Date.now() });
    toast.info('Session started', `Tracking ${subjectName(p.subjectId)} now.`);
  }, [pendingSwitch, stop, subjectName, toast]);

  const cancelSwitch = useCallback(() => setPendingSwitch(null), []);

  const actions = useMemo(
    () => ({ start, pause, resume, toggle, stop, reset, confirmSwitch, cancelSwitch }),
    [start, pause, resume, toggle, stop, reset, confirmSwitch, cancelSwitch],
  );

  const stateValue = useMemo(
    () => ({
      session,
      activeSubjectId: session?.subjectId || null,
      isRunning: Boolean(session?.isRunning),
      hasSession: Boolean(session),
      startedAt: session?.startedAt || null,
      pendingSwitch,
    }),
    [session, pendingSwitch],
  );

  return (
    <TimerActionsContext.Provider value={actions}>
      <TimerStateContext.Provider value={stateValue}>
        <TimerTickContext.Provider value={tick}>{children}</TimerTickContext.Provider>
      </TimerStateContext.Provider>
    </TimerActionsContext.Provider>
  );
}

/* ---------------------------- hooks ---------------------------------- */

/** Active-session metadata. Does NOT update every second. */
export function useTimerState() {
  const ctx = useContext(TimerStateContext);
  if (!ctx) throw new Error('useTimerState must be used inside <TimerProvider>');
  return ctx;
}

/** Stable action object — safe to depend on anywhere. */
export function useTimerActions() {
  const ctx = useContext(TimerActionsContext);
  if (!ctx) throw new Error('useTimerActions must be used inside <TimerProvider>');
  return ctx;
}

/** 1 Hz elapsed milliseconds. ONLY call this from a visible timer component. */
export function useTimerTick() {
  return useContext(TimerTickContext);
}
