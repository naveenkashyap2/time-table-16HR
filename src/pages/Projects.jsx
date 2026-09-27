import { useCallback, useMemo, useState } from 'react';
import { Plus, FolderKanban } from 'lucide-react';
import { useStudy, useStudyActions } from '../context/StudyContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { todayKey } from '../utils/dateUtils.js';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ProjectCard, {
  PROJECT_STATUSES, PROJECT_STATUS_META,
} from '../components/Trackers/ProjectCard.jsx';

const emptyForm = {
  name: '', description: '', techText: '', startDate: todayKey(), deadline: '',
  status: 'not-started', tasksText: '',
};

function ProjectForm({ value, onChange }) {
  return (
    <>
      <div className="field">
        <label className="field-label" htmlFor="prj-name">Project name</label>
        <input id="prj-name" className="input" value={value.name} data-autofocus maxLength={80}
          onChange={(e) => onChange({ ...value, name: e.target.value })} placeholder="e.g. CareerAI" />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="prj-desc">Description</label>
        <textarea id="prj-desc" className="textarea" value={value.description} maxLength={280}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          placeholder="What does it do, and for whom?" />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="prj-tech">Tech stack</label>
        <input id="prj-tech" className="input" value={value.techText}
          onChange={(e) => onChange({ ...value, techText: e.target.value })}
          placeholder="React, Node.js, MongoDB" />
        <span className="field-hint">Comma separated.</span>
      </div>
      <div className="row wrap" style={{ gap: 'var(--sp-3)' }}>
        <div className="field grow">
          <label className="field-label" htmlFor="prj-start">Start date</label>
          <input id="prj-start" className="input" type="date" value={value.startDate}
            onChange={(e) => onChange({ ...value, startDate: e.target.value })} />
        </div>
        <div className="field grow">
          <label className="field-label" htmlFor="prj-due">Deadline</label>
          <input id="prj-due" className="input" type="date" value={value.deadline}
            onChange={(e) => onChange({ ...value, deadline: e.target.value })} />
        </div>
        <div className="field grow">
          <label className="field-label" htmlFor="prj-status">Status</label>
          <select id="prj-status" className="select" value={value.status}
            onChange={(e) => onChange({ ...value, status: e.target.value })}>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>{PROJECT_STATUS_META[s].label}</option>
            ))}
          </select>
        </div>
      </div>
      {value.tasksText !== undefined ? (
        <div className="field">
          <label className="field-label" htmlFor="prj-tasks">Initial tasks</label>
          <textarea id="prj-tasks" className="textarea" value={value.tasksText}
            onChange={(e) => onChange({ ...value, tasksText: e.target.value })}
            placeholder={'One task per line\nSet up repo\nDesign schema'} />
          <span className="field-hint">One per line. You can add more later.</span>
        </div>
      ) : null}
    </>
  );
}

export default function Projects() {
  useDocumentMeta(
    'Projects',
    'Track every side project: tech stack, deadlines, task checklists and completion percentage.',
  );

  const { projects } = useStudy();
  const {
    addProject, editProject, deleteProject, toggleProjectTask, addProjectTask, deleteProjectTask,
  } = useStudyActions();
  const toast = useToast();

  const [filter, setFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const counts = useMemo(() => {
    const c = { all: projects.length, 'not-started': 0, 'in-progress': 0, completed: 0 };
    projects.forEach((p) => { c[p.status] = (c[p.status] || 0) + 1; });
    return c;
  }, [projects]);

  const overdueCount = useMemo(
    () =>
      projects.filter(
        (p) => p.deadline && p.status !== 'completed' && p.deadline < todayKey(),
      ).length,
    [projects],
  );

  const visible = useMemo(
    () => (filter === 'all' ? projects : projects.filter((p) => p.status === filter)),
    [projects, filter],
  );

  const onStatus = useCallback(
    (project, status) => {
      editProject(project.id, { status });
      toast.success('Status updated', `${project.name} → ${PROJECT_STATUS_META[status].label}`);
    },
    [editProject, toast],
  );

  const commitAdd = () => {
    const name = form.name.trim();
    if (!name) return;
    addProject({
      name,
      description: form.description.trim(),
      tech: form.techText.split(',').map((t) => t.trim()).filter(Boolean),
      startDate: form.startDate,
      deadline: form.deadline,
      status: form.status,
      tasks: form.tasksText.split('\n').map((t) => t.trim()).filter(Boolean),
    });
    toast.success('Project added', name);
    setForm(emptyForm);
    setAddOpen(false);
  };

  const commitEdit = () => {
    const name = editing.name.trim();
    if (!name) return;
    editProject(editing.id, {
      name,
      description: editing.description.trim(),
      tech: editing.techText.split(',').map((t) => t.trim()).filter(Boolean),
      startDate: editing.startDate,
      deadline: editing.deadline,
      status: editing.status,
    });
    toast.success('Project updated', name);
    setEditing(null);
  };

  const openEdit = (project) =>
    setEditing({
      id: project.id,
      name: project.name,
      description: project.description || '',
      techText: (project.tech || []).join(', '),
      startDate: project.startDate || '',
      deadline: project.deadline || '',
      status: project.status,
    });

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Projects</h1>
          <p className="page-sub">
            {counts['in-progress']} in progress · {counts.completed} completed
            {overdueCount > 0 ? ` · ${overdueCount} overdue` : ''}
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setAddOpen(true)}>
          Add Project
        </Button>
      </header>

      <div className="row wrap" style={{ marginBottom: 'var(--sp-4)' }}>
        {['all', ...PROJECT_STATUSES].map((f) => (
          <button
            key={f}
            type="button"
            className={`chip chip-btn${filter === f ? ' is-active' : ''}`}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
          >
            {f === 'all' ? 'All' : PROJECT_STATUS_META[f].label} ({counts[f] || 0})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={FolderKanban}
            title={projects.length === 0 ? 'No projects yet' : 'Nothing in this status'}
            message={
              projects.length === 0
                ? 'Add your first project to track its tasks, stack and deadline.'
                : 'Switch the filter to see your other projects.'
            }
            actionLabel={projects.length === 0 ? 'Add Project' : 'Show all'}
            onAction={projects.length === 0 ? () => setAddOpen(true) : () => setFilter('all')}
          />
        </Card>
      ) : (
        <div className="subject-grid">
          {visible.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onToggleTask={toggleProjectTask}
              onAddTask={addProjectTask}
              onDeleteTask={deleteProjectTask}
              onEdit={openEdit}
              onDelete={setToDelete}
              onStatus={onStatus}
            />
          ))}
        </div>
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Project"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={commitAdd} disabled={!form.name.trim()}>Add project</Button>
          </>
        }
      >
        <ProjectForm value={form} onChange={setForm} />
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit Project"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="primary" onClick={commitEdit} disabled={!editing?.name?.trim()}>Save changes</Button>
          </>
        }
      >
        {editing ? <ProjectForm value={editing} onChange={setEditing} /> : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          deleteProject(toDelete.id);
          toast.info('Project deleted', toDelete.name);
          setToDelete(null);
        }}
        danger
        title="Delete this project?"
        confirmLabel="Delete project"
        message={toDelete ? `"${toDelete.name}" and all of its tasks will be removed.` : ''}
      />
    </>
  );
}
