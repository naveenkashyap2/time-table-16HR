import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { K, loadData, saveData, saveDataNow, clearAllData, onStorageError } from '../utils/storage.js';
import { migrate } from '../utils/migrations.js';
import { buildSeedState, DEFAULT_SETTINGS } from '../data/seed.js';
import { uid } from '../utils/id.js';
import { todayKey } from '../utils/dateUtils.js';
import {
  applySessionToRecords,
  ensureTodayRecord,
  rebuildRecords,
  retargetFrom,
} from '../utils/dayRecords.js';
import { evaluateAchievements, getAchievement } from '../utils/achievementsEngine.js';
import { useToast } from './ToastContext.jsx';

/* ========================================================================= *
 * Contexts — state and dispatch are split so components that only need
 * actions never re-render when data changes.
 * ========================================================================= */
const StudyStateContext = createContext(null);
const StudyActionsContext = createContext(null);

/* ========================================================================= *
 * Initial state — read synchronously from localStorage (no loading flash)
 * ========================================================================= */
function readInitialState() {
  migrate(); // upgrade old shapes before anything reads them

  const settings = { ...DEFAULT_SETTINGS, ...loadData(K.SETTINGS, {}) };
  settings.notifications = { ...DEFAULT_SETTINGS.notifications, ...(settings.notifications || {}) };
  settings.quote = { ...DEFAULT_SETTINGS.quote, ...(settings.quote || {}) };

  return {
    settings,
    subjects: loadData(K.SUBJECTS, []),
    tasks: loadData(K.TASKS, []),
    sessions: loadData(K.SESSIONS, []),
    dailyRecords: loadData(K.DAILY_RECORDS, {}),
    dsa: loadData(K.DSA, []),
    projects: loadData(K.PROJECTS, []),
    interview: loadData(K.INTERVIEW, []),
    sdTopics: loadData(K.SD_TOPICS, []),
    dotnetTopics: loadData(K.DOTNET_TOPICS, []),
    rnTopics: loadData(K.RN_TOPICS, []),
    achievements: loadData(K.ACHIEVEMENTS, {}),
    notifications: loadData(K.NOTIFICATIONS, []),
  };
}

const TOPIC_SLICE = {
  sd: 'sdTopics',
  dotnet: 'dotnetTopics',
  rn: 'rnTopics',
};

/* ========================================================================= *
 * Reducer — PRD §7.2
 * ========================================================================= */
export function studyReducer(state, action) {
  switch (action.type) {
    /* ---------------- bootstrap ---------------- */
    case 'INIT_FROM_STORAGE':
      return { ...state, ...action.payload };

    case 'SEED_DEFAULTS': {
      const seeded = buildSeedState(action.overrides);
      return { ...state, ...seeded };
    }

    case 'ROLLOVER': {
      // PRD §9.3 — make sure today's record exists; history untouched.
      return {
        ...state,
        dailyRecords: ensureTodayRecord(
          state.dailyRecords,
          state.settings.dailyTargetMinutes,
          action.dateKey,
        ),
      };
    }

    /* ---------------- subjects ---------------- */
    case 'SUBJECT_ADD': {
      const order = state.subjects.length;
      const subject = {
        id: uid('sub'),
        slug: action.payload.slug || `custom-${order}`,
        name: action.payload.name,
        iconKey: action.payload.iconKey || 'BookOpen',
        colorKey: action.payload.colorKey || 'primary',
        targetMinutes: Math.max(0, Number(action.payload.targetMinutes) || 0),
        order,
        subBlocks: action.payload.subBlocks || [],
      };
      return { ...state, subjects: [...state.subjects, subject] };
    }

    case 'SUBJECT_EDIT':
      return {
        ...state,
        subjects: state.subjects.map((s) =>
          s.id === action.id ? { ...s, ...action.patch } : s,
        ),
      };

    case 'SUBJECT_DELETE':
      return {
        ...state,
        subjects: state.subjects
          .filter((s) => s.id !== action.id)
          .map((s, i) => ({ ...s, order: i })),
        tasks: state.tasks.filter((t) => t.subjectId !== action.id),
      };

    case 'SUBJECT_REORDER': {
      const list = [...state.subjects].sort((a, b) => a.order - b.order);
      const from = list.findIndex((s) => s.id === action.id);
      const to = from + action.direction;
      if (from < 0 || to < 0 || to >= list.length) return state;
      const [moved] = list.splice(from, 1);
      list.splice(to, 0, moved);
      return { ...state, subjects: list.map((s, i) => ({ ...s, order: i })) };
    }

    /* ---------------- tasks ---------------- */
    case 'TASK_ADD':
      return {
        ...state,
        tasks: [
          ...state.tasks,
          {
            id: uid('task'),
            subjectId: action.payload.subjectId,
            title: action.payload.title,
            createdAt: Date.now(),
            doneDates: [],
          },
        ],
      };

    case 'TASK_EDIT':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t)),
      };

    case 'TASK_DELETE':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) };

    case 'TASK_TOGGLE_TODAY': {
      const key = action.dateKey || todayKey();
      return {
        ...state,
        tasks: state.tasks.map((t) => {
          if (t.id !== action.id) return t;
          const done = (t.doneDates || []).includes(key);
          return {
            ...t,
            doneDates: done
              ? t.doneDates.filter((d) => d !== key)
              : [...(t.doneDates || []), key],
          };
        }),
      };
    }

    /* ---------------- sessions ---------------- */
    case 'SESSION_APPEND': {
      const session = action.session;
      if (!session || session.durationMs <= 0) return state;
      return {
        ...state,
        sessions: [...state.sessions, session],
        dailyRecords: applySessionToRecords(
          state.dailyRecords,
          session,
          state.settings.dailyTargetMinutes,
        ),
      };
    }

    case 'SESSION_DELETE': {
      const sessions = state.sessions.filter((s) => s.id !== action.id);
      return {
        ...state,
        sessions,
        dailyRecords: rebuildRecords(
          sessions,
          state.dailyRecords,
          state.settings.dailyTargetMinutes,
        ),
      };
    }

    case 'DAY_RECORD_UPSERT':
      return {
        ...state,
        dailyRecords: {
          ...state.dailyRecords,
          [action.dateKey]: {
            ...(state.dailyRecords[action.dateKey] || {}),
            dateKey: action.dateKey,
            ...action.patch,
            updatedAt: Date.now(),
          },
        },
      };

    /* ---------------- DSA ---------------- */
    case 'DSA_ADD':
      return {
        ...state,
        dsa: [
          {
            id: uid('dsa'),
            title: action.payload.title,
            topic: action.payload.topic,
            difficulty: action.payload.difficulty || 'Easy',
            status: action.payload.status || 'not-started',
            date: action.payload.status === 'solved' ? todayKey() : null,
            notes: action.payload.notes || '',
            url: action.payload.url || '',
          },
          ...state.dsa,
        ],
      };

    case 'DSA_EDIT':
      return {
        ...state,
        dsa: state.dsa.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)),
      };

    case 'DSA_DELETE':
      return { ...state, dsa: state.dsa.filter((p) => p.id !== action.id) };

    case 'DSA_STATUS_SET':
      return {
        ...state,
        dsa: state.dsa.map((p) =>
          p.id === action.id
            ? {
                ...p,
                status: action.status,
                date: action.status === 'not-started' ? null : p.date || todayKey(),
              }
            : p,
        ),
      };

    /* ---------------- projects ---------------- */
    case 'PROJECT_ADD':
      return {
        ...state,
        projects: [
          {
            id: uid('proj'),
            name: action.payload.name,
            description: action.payload.description || '',
            tech: action.payload.tech || [],
            startDate: action.payload.startDate || todayKey(),
            deadline: action.payload.deadline || '',
            status: action.payload.status || 'not-started',
            tasks: (action.payload.tasks || []).map((t, i) => ({
              id: uid('ptask'),
              title: typeof t === 'string' ? t : t.title,
              done: false,
              order: i,
            })),
            createdAt: Date.now(),
          },
          ...state.projects,
        ],
      };

    case 'PROJECT_EDIT':
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.id ? { ...p, ...action.patch } : p,
        ),
      };

    case 'PROJECT_DELETE':
      return { ...state, projects: state.projects.filter((p) => p.id !== action.id) };

    case 'PROJECT_TASK_TOGGLE':
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id !== action.projectId
            ? p
            : {
                ...p,
                tasks: p.tasks.map((t) =>
                  t.id === action.taskId ? { ...t, done: !t.done } : t,
                ),
              },
        ),
      };

    case 'PROJECT_TASK_ADD':
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id !== action.projectId
            ? p
            : {
                ...p,
                tasks: [
                  ...p.tasks,
                  { id: uid('ptask'), title: action.title, done: false, order: p.tasks.length },
                ],
              },
        ),
      };

    case 'PROJECT_TASK_DELETE':
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id !== action.projectId
            ? p
            : { ...p, tasks: p.tasks.filter((t) => t.id !== action.taskId) },
        ),
      };

    /* ---------------- interview ---------------- */
    case 'INTERVIEW_QUESTION_STATUS':
      return {
        ...state,
        interview: state.interview.map((c) =>
          c.id !== action.categoryId
            ? c
            : {
                ...c,
                questions: c.questions.map((q) =>
                  q.id === action.questionId ? { ...q, status: action.status } : q,
                ),
              },
        ),
      };

    case 'INTERVIEW_QUESTION_NOTES':
      return {
        ...state,
        interview: state.interview.map((c) =>
          c.id !== action.categoryId
            ? c
            : {
                ...c,
                questions: c.questions.map((q) =>
                  q.id === action.questionId ? { ...q, notes: action.notes } : q,
                ),
              },
        ),
      };

    case 'INTERVIEW_QUESTION_ADD':
      return {
        ...state,
        interview: state.interview.map((c) =>
          c.id !== action.categoryId
            ? c
            : {
                ...c,
                questions: [
                  ...c.questions,
                  { id: uid('q'), text: action.text, status: 'pending', notes: '' },
                ],
              },
        ),
      };

    case 'INTERVIEW_QUESTION_DELETE':
      return {
        ...state,
        interview: state.interview.map((c) =>
          c.id !== action.categoryId
            ? c
            : { ...c, questions: c.questions.filter((q) => q.id !== action.questionId) },
        ),
      };

    /* ---------------- topic trackers (sd / dotnet / rn) ---------------- */
    case 'TOPIC_STATUS_SET': {
      const slice = TOPIC_SLICE[action.tracker];
      if (!slice) return state;
      return {
        ...state,
        [slice]: state[slice].map((t) =>
          t.id === action.id ? { ...t, status: action.status, updatedAt: Date.now() } : t,
        ),
      };
    }

    case 'TOPIC_NOTES_SET': {
      const slice = TOPIC_SLICE[action.tracker];
      if (!slice) return state;
      return {
        ...state,
        [slice]: state[slice].map((t) =>
          t.id === action.id ? { ...t, notes: action.notes, updatedAt: Date.now() } : t,
        ),
      };
    }

    case 'TOPIC_ADD': {
      const slice = TOPIC_SLICE[action.tracker];
      if (!slice) return state;
      return {
        ...state,
        [slice]: [
          ...state[slice],
          { id: uid('tp'), name: action.name, status: 'not-started', notes: '', updatedAt: null },
        ],
      };
    }

    case 'TOPIC_DELETE': {
      const slice = TOPIC_SLICE[action.tracker];
      if (!slice) return state;
      return { ...state, [slice]: state[slice].filter((t) => t.id !== action.id) };
    }

    /* ---------------- achievements ---------------- */
    case 'ACHIEVEMENT_UNLOCK': {
      const stamped = { ...state.achievements };
      action.ids.forEach((id) => {
        if (!stamped[id]) stamped[id] = new Date().toISOString();
      });
      return { ...state, achievements: stamped };
    }

    /* ---------------- notifications (in-app bell) ---------------- */
    case 'NOTIFICATION_ADD':
      return {
        ...state,
        notifications: [
          { id: uid('ntf'), at: Date.now(), read: false, ...action.payload },
          ...state.notifications,
        ].slice(0, 50),
      };

    case 'NOTIFICATION_CLEAR':
      return { ...state, notifications: [] };

    case 'NOTIFICATION_MARK_ALL_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      };

    /* ---------------- settings ---------------- */
    case 'SETTINGS_UPDATE': {
      const settings = { ...state.settings, ...action.patch };
      let dailyRecords = state.dailyRecords;
      if (
        action.patch.dailyTargetMinutes !== undefined &&
        action.patch.dailyTargetMinutes !== state.settings.dailyTargetMinutes
      ) {
        dailyRecords = retargetFrom(
          state.dailyRecords,
          todayKey(),
          settings.dailyTargetMinutes,
        );
      }
      return { ...state, settings, dailyRecords };
    }

    /* ---------------- import / reset ---------------- */
    case 'IMPORT_REPLACE_ALL': {
      const d = action.payload;
      const settings = { ...DEFAULT_SETTINGS, ...(d.settings || {}) };
      const sessions = d.sessions || [];
      return {
        settings,
        subjects: d.subjects || [],
        tasks: d.tasks || [],
        sessions,
        dailyRecords: rebuildRecords(
          sessions,
          d.dailyRecords || {},
          settings.dailyTargetMinutes,
        ),
        dsa: d.dsa || [],
        projects: d.projects || [],
        interview: d.interview || [],
        sdTopics: d.sdTopics || [],
        dotnetTopics: d.dotnetTopics || [],
        rnTopics: d.rnTopics || [],
        achievements: d.achievements || {},
        notifications: [],
      };
    }

    case 'RESET_ALL':
      return { ...buildSeedState(), settings: { ...DEFAULT_SETTINGS, onboarded: false } };

    default:
      return state;
  }
}

/* ========================================================================= *
 * Provider
 * ========================================================================= */
export function StudyProvider({ children, initialState }) {
  const [state, dispatch] = useReducer(
    studyReducer,
    initialState,
    (init) => init || readInitialState(),
  );
  const toast = useToast();

  /* ---- Persistence: debounced 300 ms per changed key (§4.2 / §7.2) -----
   * One effect per slice, so only the keys that actually changed are
   * re-serialised. `saveData` itself debounces at 300 ms.                */
  useEffect(() => { saveData(K.SETTINGS, state.settings); }, [state.settings]);
  useEffect(() => { saveData(K.SUBJECTS, state.subjects); }, [state.subjects]);
  useEffect(() => { saveData(K.TASKS, state.tasks); }, [state.tasks]);
  useEffect(() => { saveData(K.SESSIONS, state.sessions); }, [state.sessions]);
  useEffect(() => { saveData(K.DAILY_RECORDS, state.dailyRecords); }, [state.dailyRecords]);
  useEffect(() => { saveData(K.DSA, state.dsa); }, [state.dsa]);
  useEffect(() => { saveData(K.PROJECTS, state.projects); }, [state.projects]);
  useEffect(() => { saveData(K.INTERVIEW, state.interview); }, [state.interview]);
  useEffect(() => { saveData(K.SD_TOPICS, state.sdTopics); }, [state.sdTopics]);
  useEffect(() => { saveData(K.DOTNET_TOPICS, state.dotnetTopics); }, [state.dotnetTopics]);
  useEffect(() => { saveData(K.RN_TOPICS, state.rnTopics); }, [state.rnTopics]);
  useEffect(() => { saveData(K.ACHIEVEMENTS, state.achievements); }, [state.achievements]);
  useEffect(() => { saveData(K.NOTIFICATIONS, state.notifications); }, [state.notifications]);

  /* ---- Storage failures surface as toasts, never exceptions (§13) ------ */
  useEffect(
    () =>
      onStorageError((err) => {
        toast.error('Storage problem', err.message);
      }),
    [toast],
  );

  /* ---- Daily rollover (§9.3): on mount + when the tab is revealed ------ */
  const lastOpenRef = useRef(loadData(K.LAST_OPEN_DATE, null));
  useEffect(() => {
    const check = () => {
      const key = todayKey();
      if (lastOpenRef.current !== key) {
        lastOpenRef.current = key;
        saveDataNow(K.LAST_OPEN_DATE, key);
        dispatch({ type: 'ROLLOVER', dateKey: key });
      }
    };
    check();
    const onVis = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onVis);
    };
  }, []);

  /* ---- Achievement evaluation after every relevant mutation (§9.6) ---- */
  const firstEval = useRef(true);
  useEffect(() => {
    const newly = evaluateAchievements(state);
    if (newly.length === 0) return;

    dispatch({ type: 'ACHIEVEMENT_UNLOCK', ids: newly });

    // Silent on the very first evaluation after an import/reseed flood.
    if (firstEval.current && newly.length > 3) {
      firstEval.current = false;
      return;
    }
    firstEval.current = false;

    newly.forEach((id) => {
      const a = getAchievement(id);
      if (!a) return;
      toast.achievement(`${a.emoji} Achievement unlocked!`, a.name);
      dispatch({
        type: 'NOTIFICATION_ADD',
        payload: { kind: 'achievement', title: 'Achievement unlocked', body: a.name },
      });
    });
    window.dispatchEvent(new CustomEvent('studyloop:confetti'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sessions, state.dailyRecords, state.dsa, state.achievements]);

  /* ---- Actions (stable identities — §4.2) ----------------------------- */
  const actions = useMemo(
    () => ({
      dispatch,

      seedDefaults: (overrides) => dispatch({ type: 'SEED_DEFAULTS', overrides }),

      addSubject: (payload) => dispatch({ type: 'SUBJECT_ADD', payload }),
      editSubject: (id, patch) => dispatch({ type: 'SUBJECT_EDIT', id, patch }),
      deleteSubject: (id) => dispatch({ type: 'SUBJECT_DELETE', id }),
      reorderSubject: (id, direction) => dispatch({ type: 'SUBJECT_REORDER', id, direction }),

      addTask: (payload) => dispatch({ type: 'TASK_ADD', payload }),
      editTask: (id, patch) => dispatch({ type: 'TASK_EDIT', id, patch }),
      deleteTask: (id) => dispatch({ type: 'TASK_DELETE', id }),
      toggleTaskToday: (id, dateKey) => dispatch({ type: 'TASK_TOGGLE_TODAY', id, dateKey }),

      appendSession: (session) => dispatch({ type: 'SESSION_APPEND', session }),
      deleteSession: (id) => dispatch({ type: 'SESSION_DELETE', id }),
      upsertDayRecord: (dateKey, patch) =>
        dispatch({ type: 'DAY_RECORD_UPSERT', dateKey, patch }),

      addProblem: (payload) => dispatch({ type: 'DSA_ADD', payload }),
      editProblem: (id, patch) => dispatch({ type: 'DSA_EDIT', id, patch }),
      deleteProblem: (id) => dispatch({ type: 'DSA_DELETE', id }),
      setProblemStatus: (id, status) => dispatch({ type: 'DSA_STATUS_SET', id, status }),

      addProject: (payload) => dispatch({ type: 'PROJECT_ADD', payload }),
      editProject: (id, patch) => dispatch({ type: 'PROJECT_EDIT', id, patch }),
      deleteProject: (id) => dispatch({ type: 'PROJECT_DELETE', id }),
      toggleProjectTask: (projectId, taskId) =>
        dispatch({ type: 'PROJECT_TASK_TOGGLE', projectId, taskId }),
      addProjectTask: (projectId, title) =>
        dispatch({ type: 'PROJECT_TASK_ADD', projectId, title }),
      deleteProjectTask: (projectId, taskId) =>
        dispatch({ type: 'PROJECT_TASK_DELETE', projectId, taskId }),

      setQuestionStatus: (categoryId, questionId, status) =>
        dispatch({ type: 'INTERVIEW_QUESTION_STATUS', categoryId, questionId, status }),
      setQuestionNotes: (categoryId, questionId, notes) =>
        dispatch({ type: 'INTERVIEW_QUESTION_NOTES', categoryId, questionId, notes }),
      addQuestion: (categoryId, text) =>
        dispatch({ type: 'INTERVIEW_QUESTION_ADD', categoryId, text }),
      deleteQuestion: (categoryId, questionId) =>
        dispatch({ type: 'INTERVIEW_QUESTION_DELETE', categoryId, questionId }),

      setTopicStatus: (tracker, id, status) =>
        dispatch({ type: 'TOPIC_STATUS_SET', tracker, id, status }),
      setTopicNotes: (tracker, id, notes) =>
        dispatch({ type: 'TOPIC_NOTES_SET', tracker, id, notes }),
      addTopic: (tracker, name) => dispatch({ type: 'TOPIC_ADD', tracker, name }),
      deleteTopic: (tracker, id) => dispatch({ type: 'TOPIC_DELETE', tracker, id }),

      updateSettings: (patch) => dispatch({ type: 'SETTINGS_UPDATE', patch }),

      addNotification: (payload) => dispatch({ type: 'NOTIFICATION_ADD', payload }),
      clearNotifications: () => dispatch({ type: 'NOTIFICATION_CLEAR' }),
      markNotificationsRead: () => dispatch({ type: 'NOTIFICATION_MARK_ALL_READ' }),

      importAll: (payload) => dispatch({ type: 'IMPORT_REPLACE_ALL', payload }),
      resetAll: () => {
        clearAllData();
        dispatch({ type: 'RESET_ALL' });
      },
    }),
    [],
  );

  return (
    <StudyActionsContext.Provider value={actions}>
      <StudyStateContext.Provider value={state}>{children}</StudyStateContext.Provider>
    </StudyActionsContext.Provider>
  );
}

/* ========================================================================= *
 * Hooks
 * ========================================================================= */
export function useStudy() {
  const ctx = useContext(StudyStateContext);
  if (!ctx) throw new Error('useStudy must be used inside <StudyProvider>');
  return ctx;
}

export function useStudyActions() {
  const ctx = useContext(StudyActionsContext);
  if (!ctx) throw new Error('useStudyActions must be used inside <StudyProvider>');
  return ctx;
}

export function useSettings() {
  return useStudy().settings;
}

export function useSubjects() {
  const subjects = useStudy().subjects;
  return useMemo(
    () => [...subjects].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [subjects],
  );
}
