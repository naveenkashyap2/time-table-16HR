/**
 * backup.js — export / import (PRD §10.13, §12.5).
 * Import is validated per-schema BEFORE anything is written; on any problem
 * the state is left completely untouched.
 */
import { SCHEMA_VERSION } from './storage.js';
import { isValidDateKey } from './dateUtils.js';

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024; // 5 MB (§12.5)
export const BACKUP_FILENAME = 'study-tracker-backup.json';

/** Build the full dump. */
export function buildBackup(state) {
  return {
    app: 'StudyLoop',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings: state.settings,
    subjects: state.subjects,
    tasks: state.tasks,
    sessions: state.sessions,
    dailyRecords: state.dailyRecords,
    dsa: state.dsa,
    projects: state.projects,
    interview: state.interview,
    sdTopics: state.sdTopics,
    dotnetTopics: state.dotnetTopics,
    rnTopics: state.rnTopics,
    achievements: state.achievements,
  };
}

export function downloadBackup(state, filename = BACKUP_FILENAME) {
  const json = JSON.stringify(buildBackup(state), null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return json.length;
}

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isArr = Array.isArray;
const isStr = (v) => typeof v === 'string';
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/**
 * @returns {{ok:true, data:object, summary:object} | {ok:false, error:string}}
 */
export function validateBackup(raw) {
  let data;
  try {
    data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' };
  }

  if (!isObj(data)) return { ok: false, error: 'The backup must be a JSON object.' };
  if (data.app && data.app !== 'StudyLoop') {
    return { ok: false, error: `This backup came from "${data.app}", not StudyLoop.` };
  }

  /* ---- settings ---- */
  if (!isObj(data.settings)) return { ok: false, error: 'Missing or invalid "settings".' };
  if (!isNum(data.settings.dailyTargetMinutes) || data.settings.dailyTargetMinutes <= 0) {
    return { ok: false, error: '"settings.dailyTargetMinutes" must be a positive number.' };
  }

  /* ---- arrays ---- */
  const arrays = [
    'subjects', 'tasks', 'sessions', 'dsa', 'projects', 'interview',
    'sdTopics', 'dotnetTopics', 'rnTopics',
  ];
  for (const key of arrays) {
    if (data[key] !== undefined && !isArr(data[key])) {
      return { ok: false, error: `"${key}" must be an array.` };
    }
  }

  /* ---- subjects ---- */
  for (const s of data.subjects || []) {
    if (!isObj(s) || !isStr(s.id) || !isStr(s.name) || !isNum(s.targetMinutes)) {
      return { ok: false, error: 'A subject entry is malformed (needs id, name, targetMinutes).' };
    }
  }

  /* ---- sessions ---- */
  for (const s of data.sessions || []) {
    if (!isObj(s) || !isStr(s.id) || !isStr(s.subjectId) || !isNum(s.durationMs)) {
      return { ok: false, error: 'A session entry is malformed (needs id, subjectId, durationMs).' };
    }
    if (!isValidDateKey(s.dateKey)) {
      return { ok: false, error: `A session has an invalid dateKey: "${s.dateKey}".` };
    }
  }

  /* ---- tasks ---- */
  for (const t of data.tasks || []) {
    if (!isObj(t) || !isStr(t.id) || !isStr(t.title)) {
      return { ok: false, error: 'A task entry is malformed (needs id, title).' };
    }
    if (t.doneDates !== undefined && !isArr(t.doneDates)) {
      return { ok: false, error: 'A task has an invalid "doneDates" list.' };
    }
  }

  /* ---- dailyRecords ---- */
  if (data.dailyRecords !== undefined) {
    if (!isObj(data.dailyRecords)) {
      return { ok: false, error: '"dailyRecords" must be an object keyed by date.' };
    }
    for (const [key, rec] of Object.entries(data.dailyRecords)) {
      if (!isValidDateKey(key)) {
        return { ok: false, error: `"dailyRecords" has an invalid date key: "${key}".` };
      }
      if (!isObj(rec) || !isNum(rec.targetMinutes)) {
        return { ok: false, error: `The record for ${key} is malformed.` };
      }
    }
  }

  /* ---- achievements ---- */
  if (data.achievements !== undefined && !isObj(data.achievements)) {
    return { ok: false, error: '"achievements" must be an object of { id: unlockedAt }.' };
  }

  /* ---- summary for the confirm modal ---- */
  const totalMinutes = Object.values(data.dailyRecords || {}).reduce(
    (sum, r) => sum + (Number(r?.completedMinutes) || 0),
    0,
  );

  return {
    ok: true,
    data,
    summary: {
      exportedAt: data.exportedAt || null,
      schemaVersion: data.schemaVersion ?? 1,
      subjects: (data.subjects || []).length,
      tasks: (data.tasks || []).length,
      sessions: (data.sessions || []).length,
      days: Object.keys(data.dailyRecords || {}).length,
      dsa: (data.dsa || []).length,
      projects: (data.projects || []).length,
      achievements: Object.keys(data.achievements || {}).length,
      totalMinutes,
    },
  };
}
