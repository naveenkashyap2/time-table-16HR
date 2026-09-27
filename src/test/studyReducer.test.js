import { describe, it, expect } from 'vitest';
import { studyReducer } from '../context/StudyContext.jsx';
import { buildSeedState } from '../data/seed.js';
import { todayKey } from '../utils/dateUtils.js';

const seed = () => buildSeedState({ onboarded: true });

describe('study reducer', () => {
  it('appends a session and updates the day record atomically', () => {
    const s0 = seed();
    const subjectId = s0.subjects[0].id;
    const s1 = studyReducer(s0, {
      type: 'SESSION_APPEND',
      session: {
        id: 'x', subjectId, dateKey: todayKey(),
        startAt: 0, endAt: 5_400_000, durationMs: 5_400_000, source: 'timer',
      },
    });
    expect(s1.sessions).toHaveLength(1);
    expect(s1.dailyRecords[todayKey()].completedMinutes).toBe(90);
    expect(s1.dailyRecords[todayKey()].perSubject[subjectId]).toBe(90);
  });

  it('recomputes records when a session is deleted', () => {
    let s = seed();
    const subjectId = s.subjects[0].id;
    s = studyReducer(s, {
      type: 'SESSION_APPEND',
      session: { id: 'x', subjectId, dateKey: todayKey(), startAt: 0, endAt: 1, durationMs: 3_600_000 },
    });
    s = studyReducer(s, { type: 'SESSION_DELETE', id: 'x' });
    expect(s.sessions).toHaveLength(0);
    expect(s.dailyRecords[todayKey()].completedMinutes).toBe(0);
  });

  it('toggles a task for today and back', () => {
    let s = seed();
    const taskId = s.tasks[0].id;
    s = studyReducer(s, { type: 'TASK_TOGGLE_TODAY', id: taskId });
    expect(s.tasks[0].doneDates).toContain(todayKey());
    s = studyReducer(s, { type: 'TASK_TOGGLE_TODAY', id: taskId });
    expect(s.tasks[0].doneDates).not.toContain(todayKey());
  });

  it('reorders subjects and renumbers the order field', () => {
    let s = seed();
    const second = s.subjects[1];
    s = studyReducer(s, { type: 'SUBJECT_REORDER', id: second.id, direction: -1 });
    const sorted = [...s.subjects].sort((a, b) => a.order - b.order);
    expect(sorted[0].id).toBe(second.id);
    expect(sorted.map((x) => x.order)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('refuses to reorder past the ends', () => {
    const s = seed();
    const first = [...s.subjects].sort((a, b) => a.order - b.order)[0];
    expect(studyReducer(s, { type: 'SUBJECT_REORDER', id: first.id, direction: -1 })).toBe(s);
  });

  it('deleting a subject removes its tasks but keeps session history', () => {
    let s = seed();
    const subject = s.subjects[0];
    s = studyReducer(s, {
      type: 'SESSION_APPEND',
      session: { id: 'x', subjectId: subject.id, dateKey: todayKey(), startAt: 0, endAt: 1, durationMs: 3_600_000 },
    });
    s = studyReducer(s, { type: 'SUBJECT_DELETE', id: subject.id });
    expect(s.subjects.some((x) => x.id === subject.id)).toBe(false);
    expect(s.tasks.some((t) => t.subjectId === subject.id)).toBe(false);
    expect(s.sessions).toHaveLength(1); // history preserved
  });

  it('re-targets today and future days when the daily goal changes', () => {
    let s = seed();
    s = studyReducer(s, { type: 'SETTINGS_UPDATE', patch: { dailyTargetMinutes: 600 } });
    expect(s.settings.dailyTargetMinutes).toBe(600);
    expect(s.dailyRecords[todayKey()].targetMinutes).toBe(600);
  });

  it('cycles topic status and stamps updatedAt', () => {
    let s = seed();
    const topic = s.sdTopics[0];
    s = studyReducer(s, { type: 'TOPIC_STATUS_SET', tracker: 'sd', id: topic.id, status: 'completed' });
    expect(s.sdTopics[0].status).toBe('completed');
    expect(s.sdTopics[0].updatedAt).toBeTruthy();
  });

  it('stamps an achievement unlock once', () => {
    let s = seed();
    s = studyReducer(s, { type: 'ACHIEVEMENT_UNLOCK', ids: ['first-session'] });
    const first = s.achievements['first-session'];
    s = studyReducer(s, { type: 'ACHIEVEMENT_UNLOCK', ids: ['first-session'] });
    expect(s.achievements['first-session']).toBe(first);
  });

  it('IMPORT_REPLACE_ALL rebuilds records from the imported sessions', () => {
    const s0 = seed();
    const imported = studyReducer(s0, {
      type: 'IMPORT_REPLACE_ALL',
      payload: {
        settings: { dailyTargetMinutes: 960 },
        subjects: [{ id: 'a', name: 'A', targetMinutes: 60, order: 0 }],
        sessions: [
          { id: 's1', subjectId: 'a', dateKey: '2026-09-20', durationMs: 3_600_000 },
        ],
        dailyRecords: {},
      },
    });
    expect(imported.subjects).toHaveLength(1);
    expect(imported.dailyRecords['2026-09-20'].completedMinutes).toBe(60);
  });

  it('ignores zero-length sessions', () => {
    const s0 = seed();
    const s1 = studyReducer(s0, {
      type: 'SESSION_APPEND',
      session: { id: 'z', subjectId: s0.subjects[0].id, dateKey: todayKey(), durationMs: 0 },
    });
    expect(s1).toBe(s0);
  });
});
