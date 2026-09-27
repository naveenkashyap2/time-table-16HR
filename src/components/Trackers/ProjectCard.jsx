import { memo, useState } from 'react';
import { Pencil, Trash2, Plus, CalendarClock, AlertTriangle, X } from 'lucide-react';
import Button from '../common/Button.jsx';
import ProgressBar from '../common/ProgressBar.jsx';
import { formatShortDate, todayKey } from '../../utils/dateUtils.js';

const STATUS_META = {
  'not-started': { label: 'Not started', cls: 'badge-neutral' },
  'in-progress': { label: 'In progress', cls: 'badge-warning' },
  completed: { label: 'Completed', cls: 'badge-success' },
};

export const PROJECT_STATUSES = Object.keys(STATUS_META);
export { STATUS_META as PROJECT_STATUS_META };

const ProjectCard = memo(function ProjectCard({
  project, onToggleTask, onAddTask, onDeleteTask, onEdit, onDelete, onStatus,
}) {
  const [newTask, setNewTask] = useState('');
  const done = project.tasks.filter((t) => t.done).length;
  const total = project.tasks.length;
  const percent = total ? (done / total) * 100 : 0;
  const overdue =
    project.deadline && project.status !== 'completed' && project.deadline < todayKey();
  const meta = STATUS_META[project.status] || STATUS_META['not-started'];

  const submit = (e) => {
    e.preventDefault();
    const value = newTask.trim();
    if (!value) return;
    onAddTask(project.id, value);
    setNewTask('');
  };

  return (
    <article className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
      <header className="row-between" style={{ alignItems: 'flex-start' }}>
        <div className="grow" style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: 'var(--fs-16)' }}>{project.name}</h3>
          <p className="xsmall muted">{project.description}</p>
        </div>
        <span className={`badge ${meta.cls}`}>{meta.label}</span>
      </header>

      {project.tech?.length ? (
        <div className="row wrap" style={{ gap: 6 }}>
          {project.tech.map((t) => (
            <span key={t} className="chip xsmall">{t}</span>
          ))}
        </div>
      ) : null}

      <div className="row wrap xsmall muted" style={{ gap: 'var(--sp-3)' }}>
        <span className="row" style={{ gap: 4 }}>
          <CalendarClock size={13} aria-hidden="true" />
          Started {formatShortDate(project.startDate)}
        </span>
        {project.deadline ? (
          <span className={`row ${overdue ? 'overdue' : ''}`} style={{ gap: 4 }}>
            {overdue ? <AlertTriangle size={13} aria-hidden="true" /> : null}
            Due {formatShortDate(project.deadline)}
            {overdue ? ' — overdue' : ''}
          </span>
        ) : null}
      </div>

      <div>
        <div className="row-between xsmall muted" style={{ marginBottom: 6 }}>
          <span>{done}/{total} tasks</span>
          <span className="tnum" style={{ fontWeight: 700, color: 'var(--text)' }}>
            {Math.round(percent)}%
          </span>
        </div>
        <ProgressBar
          percent={percent}
          tone={percent === 100 ? 'success' : 'gradient'}
          label={`${project.name}: ${Math.round(percent)}% complete`}
        />
      </div>

      <ul className="list-reset" style={{ display: 'grid', gap: 4 }}>
        {project.tasks.map((t) => (
          <li key={t.id} className="row" style={{ gap: 8 }}>
            <input
              type="checkbox"
              className="checkbox"
              checked={t.done}
              onChange={() => onToggleTask(project.id, t.id)}
              id={`pt-${t.id}`}
            />
            <label
              htmlFor={`pt-${t.id}`}
              className="grow small"
              style={{
                textDecoration: t.done ? 'line-through' : 'none',
                color: t.done ? 'var(--muted)' : 'var(--text)',
              }}
            >
              {t.title}
            </label>
            <Button
              size="sm" variant="ghost" iconOnly icon={X}
              onClick={() => onDeleteTask(project.id, t.id)}
              aria-label={`Remove task ${t.title}`}
            />
          </li>
        ))}
      </ul>

      <form className="row" onSubmit={submit} style={{ gap: 8 }}>
        <input
          className="input grow"
          placeholder="Add a project task…"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          aria-label={`New task for ${project.name}`}
          maxLength={120}
        />
        <Button size="sm" variant="secondary" iconOnly icon={Plus} type="submit"
          disabled={!newTask.trim()} aria-label="Add project task" />
      </form>

      <div className="row wrap" style={{ marginTop: 'auto', gap: 8 }}>
        <label className="sr-only" htmlFor={`ps-${project.id}`}>Status for {project.name}</label>
        <select
          id={`ps-${project.id}`}
          className="select grow"
          value={project.status}
          onChange={(e) => onStatus(project, e.target.value)}
          style={{ maxWidth: 180, minHeight: 38 }}
        >
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </select>
        <Button size="sm" variant="ghost" iconOnly icon={Pencil} onClick={() => onEdit(project)}
          aria-label={`Edit ${project.name}`} />
        <Button size="sm" variant="ghost" iconOnly icon={Trash2} onClick={() => onDelete(project)}
          aria-label={`Delete ${project.name}`} />
      </div>
    </article>
  );
});

export default ProjectCard;
