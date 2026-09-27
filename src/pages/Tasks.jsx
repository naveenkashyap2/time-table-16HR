import { useCallback, useMemo, useState } from 'react';
import { CheckSquare, ListTodo } from 'lucide-react';
import { useStudy, useStudyActions } from '../context/StudyContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useTaskStats } from '../hooks/useStudyProgress.js';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { todayKey, formatLongDate } from '../utils/dateUtils.js';
import { getIcon } from '../data/icons.js';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ProgressBar from '../components/common/ProgressBar.jsx';
import TaskList from '../components/Tasks/TaskList.jsx';
import AddTask from '../components/Tasks/AddTask.jsx';

export default function Tasks() {
  useDocumentMeta(
    'Tasks',
    'Daily study checklist grouped by subject. Unchecked tasks roll into tomorrow automatically.',
  );

  const { subjects, tasks } = useStudy();
  const { addTask, editTask, deleteTask, toggleTaskToday } = useStudyActions();
  const toast = useToast();
  const tKey = todayKey();
  const stats = useTaskStats(tKey);
  const [toDelete, setToDelete] = useState(null);
  const [showDoneOnly, setShowDoneOnly] = useState('all');

  const doneIds = useMemo(
    () => new Set(tasks.filter((t) => (t.doneDates || []).includes(tKey)).map((t) => t.id)),
    [tasks, tKey],
  );

  const ordered = useMemo(
    () => [...subjects].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [subjects],
  );

  const handleToggle = useCallback(
    (id) => {
      const wasDone = doneIds.has(id);
      toggleTaskToday(id);
      if (!wasDone) {
        const task = tasks.find((t) => t.id === id);
        toast.success('Task completed', task?.title || 'Nice work.');
      }
    },
    [doneIds, toggleTaskToday, tasks, toast],
  );

  const handleAdd = useCallback(
    (payload) => {
      addTask(payload);
      toast.success('Task added', payload.title);
    },
    [addTask, toast],
  );

  const commitDelete = () => {
    deleteTask(toDelete.id);
    toast.info('Task deleted', toDelete.title);
    setToDelete(null);
  };

  const filterTasks = (list) => {
    if (showDoneOnly === 'done') return list.filter((t) => doneIds.has(t.id));
    if (showDoneOnly === 'pending') return list.filter((t) => !doneIds.has(t.id));
    return list;
  };

  const overallPercent = stats.total > 0 ? (stats.done / stats.total) * 100 : 0;

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Tasks</h1>
          <p className="page-sub">{formatLongDate()} · checklist resets every day</p>
        </div>
        <div className="row wrap">
          {['all', 'pending', 'done'].map((f) => (
            <button
              key={f}
              type="button"
              className={`chip chip-btn${showDoneOnly === f ? ' is-active' : ''}`}
              onClick={() => setShowDoneOnly(f)}
              aria-pressed={showDoneOnly === f}
            >
              {f === 'all' ? 'All' : f === 'done' ? 'Done' : 'Pending'}
            </button>
          ))}
        </div>
      </header>

      <Card title="Today's progress" icon={ListTodo}>
        <div className="row-between" style={{ marginBottom: 'var(--sp-3)' }}>
          <span className="small muted">
            <strong className="tnum" style={{ color: 'var(--text)', fontSize: 'var(--fs-20)' }}>
              {stats.done}
            </strong>{' '}
            of {stats.total} tasks done today
          </span>
          <span className="chip is-active tnum">{Math.round(overallPercent)}%</span>
        </div>
        <ProgressBar percent={overallPercent} size="lg" label="Tasks completed today" />
        <div style={{ marginTop: 'var(--sp-4)' }}>
          <AddTask subjects={ordered} onAdd={handleAdd} />
        </div>
      </Card>

      {ordered.length === 0 ? (
        <Card className="section">
          <EmptyState
            icon={CheckSquare}
            title="No subjects yet"
            message="Tasks are grouped by subject. Add a subject to your plan first."
            actionLabel="Set up my plan"
            actionTo="/plan"
          />
        </Card>
      ) : (
        <div className="section stack" style={{ gap: 'var(--sp-4)' }}>
          {stats.bySubject.map(({ subject, tasks: list, done, total }) => {
            const Icon = getIcon(subject.iconKey);
            const visible = filterTasks(list);
            if (showDoneOnly !== 'all' && visible.length === 0) return null;
            return (
              <Card key={subject.id}>
                <div className="card-head">
                  <h2 className="card-title">
                    <span
                      className={`subject-icon tone-${subject.colorKey}`}
                      style={{ width: 30, height: 30, flexBasis: 30 }}
                      aria-hidden="true"
                    >
                      <Icon size={15} />
                    </span>
                    {subject.name}
                  </h2>
                  <span className={`chip${done === total && total > 0 ? ' is-active' : ''} tnum`}>
                    {done}/{total} done today
                  </span>
                </div>

                <TaskList
                  tasks={visible}
                  doneIds={doneIds}
                  onToggle={handleToggle}
                  onEdit={editTask}
                  onDelete={setToDelete}
                  emptyMessage={`No tasks for ${subject.name} yet.`}
                />

                <div style={{ marginTop: 'var(--sp-3)' }}>
                  <AddTask subjects={ordered} defaultSubjectId={subject.id} onAdd={handleAdd} />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <p className="small muted section" style={{ textAlign: 'center' }}>
        Tasks are tracked per date — anything you leave unchecked simply shows up again tomorrow.
      </p>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onCancel={() => setToDelete(null)}
        onConfirm={commitDelete}
        danger
        title="Delete this task?"
        confirmLabel="Delete task"
        message={toDelete ? `"${toDelete.title}" will be removed from every day.` : ''}
      />
    </>
  );
}
