/**
 * seed.js — builds the complete first-launch state (PRD §16).
 * Pure: no storage access, no side effects beyond id generation.
 */
import { uid } from '../utils/id.js';
import { todayKey, toDateKey, addDays } from '../utils/dateUtils.js';
import { emptyDayRecord } from '../utils/dayRecords.js';
import { DEFAULT_SUBJECTS, SUBJECT_SLUGS } from './defaultSubjects.js';
import { DEFAULT_TASKS_BY_SLUG } from './defaultTasks.js';
import { DEFAULT_DSA_PROBLEMS } from './dsaTopics.js';
import { SYSTEM_DESIGN_TOPICS } from './systemDesignTopics.js';
import { DOTNET_TOPICS } from './dotnetTopics.js';
import { REACT_NATIVE_TOPICS } from './reactNativeTopics.js';
import { INTERVIEW_CATEGORIES } from './interviewCategories.js';
import { DEFAULT_PROJECTS } from './defaultProjects.js';
import { SCHEMA_VERSION } from '../utils/storage.js';

export const DEFAULT_SETTINGS = {
  schemaVersion: SCHEMA_VERSION,
  onboarded: false,
  userName: 'Naveen',
  dailyTargetMinutes: 960,
  streakThresholdPercent: 70,
  theme: 'system',
  weekStartsOn: 1,
  autoStopOnTarget: false,
  notifications: {
    sessionComplete: true,
    streakWarning: true,
    dailySummary: false,
  },
  quote: { enabled: true, tone: 'discipline' },
};

const topicItems = (names) =>
  names.map((name) => ({
    id: uid('tp'),
    name,
    status: 'not-started',
    notes: '',
    updatedAt: null,
  }));

export function buildSeedState(overrides = {}) {
  /* ---- Subjects ------------------------------------------------------- */
  const subjects = DEFAULT_SUBJECTS.map((s, i) => ({
    id: uid('sub'),
    slug: SUBJECT_SLUGS[s.name] || `sub-${i}`,
    name: s.name,
    iconKey: s.iconKey,
    colorKey: s.colorKey,
    targetMinutes: s.targetMinutes,
    order: i,
    subBlocks: (s.subBlocks || []).map((b) => ({ ...b })),
  }));

  /* ---- Tasks ---------------------------------------------------------- */
  const tasks = [];
  subjects.forEach((subject) => {
    (DEFAULT_TASKS_BY_SLUG[subject.slug] || []).forEach((title) => {
      tasks.push({
        id: uid('task'),
        subjectId: subject.id,
        title,
        createdAt: Date.now(),
        doneDates: [],
      });
    });
  });

  /* ---- DSA ------------------------------------------------------------ */
  const dsa = DEFAULT_DSA_PROBLEMS.map((p) => ({
    id: uid('dsa'),
    title: p.title,
    topic: p.topic,
    difficulty: p.difficulty,
    status: 'not-started',
    date: null,
    notes: '',
    url: p.url || '',
  }));

  /* ---- Projects ------------------------------------------------------- */
  const projects = DEFAULT_PROJECTS.map((p) => {
    const tasksList = p.tasks.map((t, idx) => ({
      id: uid('ptask'),
      title: t,
      done: p.status === 'completed' ? true : false,
      order: idx,
    }));
    return {
      id: uid('proj'),
      name: p.name,
      description: p.description,
      tech: [...p.tech],
      startDate: toDateKey(addDays(new Date(), p.offsetStart)),
      deadline: toDateKey(addDays(new Date(), p.offsetDeadline)),
      status: p.status,
      tasks: tasksList,
      createdAt: Date.now(),
    };
  });

  /* ---- Interview ------------------------------------------------------ */
  const interview = INTERVIEW_CATEGORIES.map((c) => ({
    id: uid('cat'),
    name: c.name,
    questions: c.questions.map((text) => ({
      id: uid('q'),
      text,
      status: 'pending',
      notes: '',
    })),
  }));

  /* ---- Settings & today ----------------------------------------------- */
  const settings = { ...DEFAULT_SETTINGS, ...overrides };
  const tKey = todayKey();

  return {
    settings,
    subjects,
    tasks,
    sessions: [],
    dailyRecords: { [tKey]: emptyDayRecord(tKey, settings.dailyTargetMinutes) },
    dsa,
    projects,
    interview,
    sdTopics: topicItems(SYSTEM_DESIGN_TOPICS),
    dotnetTopics: topicItems(DOTNET_TOPICS),
    rnTopics: topicItems(REACT_NATIVE_TOPICS),
    achievements: {},
    notifications: [],
  };
}
