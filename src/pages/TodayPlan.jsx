import { useCallback, useMemo, useState } from 'react';
import {
  Plus, Minus, ArrowUp, ArrowDown, Pencil, Trash2, Play, AlertTriangle, CheckCircle2, ListChecks,
} from 'lucide-react';
import { useStudy, useStudyActions } from '../context/StudyContext.jsx';
import { useTimerActions, useTimerState } from '../context/TimerContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAllSubjectProgress, useSubjectTargetTotal } from '../hooks/useStudyProgress.js';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { getIcon, ICON_KEYS, COLOR_KEYS } from '../data/icons.js';
import { formatMinutes } from '../utils/formatTime.js';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import ProgressBar from '../components/common/ProgressBar.jsx';
import EmptyState from '../components/common/EmptyState.jsx';

const STEP = 15; // 15-minute steps (§10.3)

const emptyForm = { name: '', iconKey: 'BookOpen', colorKey: 'primary', targetMinutes: 60 };

function SubjectForm({ value, onChange }) {
  const Preview = getIcon(value.iconKey);
  return (
    <>
      <div className="field">
        <label className="field-label" htmlFor="sf-name">Subject name</label>
        <input
          id="sf-name"
          className="input"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          maxLength={60}
          placeholder="e.g. Cloud / DevOps"
          data-autofocus
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="sf-target">Daily target</label>
        <div className="row">
          <div className="stepper">
            <Button
              size="sm" iconOnly icon={Minus}
              onClick={() => onChange({ ...value, targetMinutes: Math.max(0, value.targetMinutes - STEP) })}
              aria-label="Decrease target by 15 minutes"
            />
            <output id="sf-target" className="tnum">{formatMinutes(value.targetMinutes)}</output>
            <Button
              size="sm" iconOnly icon={Plus}
              onClick={() => onChange({ ...value, targetMinutes: Math.min(1440, value.targetMinutes + STEP) })}
              aria-label="Increase target by 15 minutes"
            />
          </div>
          <span className="field-hint">15-minute steps</span>
        </div>
      </div>

      <fieldset className="field" style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend className="field-label">Icon</legend>
        <div className="row wrap" style={{ gap: 6 }}>
          {ICON_KEYS.map((key) => {
            const Icon = getIcon(key);
            const active = key === value.iconKey;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange({ ...value, iconKey: key })}
                aria-label={key}
                aria-pressed={active}
                className="icon-btn"
                style={{
                  border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                  background: active ? 'var(--primary-soft)' : 'var(--surface)',
                  color: active ? 'var(--primary)' : 'var(--muted)',
                  width: 40, height: 40, flexBasis: 40,
                }}
              >
                <Icon size={18} />
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="field" style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend className="field-label">Colour</legend>
        <div className="row wrap">
          {COLOR_KEYS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => onChange({ ...value, colorKey: c.key })}
              aria-pressed={value.colorKey === c.key}
              className={`chip chip-btn${value.colorKey === c.key ? ' is-active' : ''}`}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: `var(--${c.key})`, display: 'inline-block',
                }}
              />
              {c.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mini-row">
        <span className={`subject-icon tone-${value.colorKey}`} style={{ width: 34, height: 34, flexBasis: 34 }} aria-hidden="true">
          <Preview size={17} />
        </span>
        <span className="grow truncate">{value.name || 'Subject preview'}</span>
        <span className="chip tnum">{formatMinutes(value.targetMinutes)}</span>
      </div>
    </>
  );
}

export default function TodayPlan() {
  useDocumentMeta(
    "Today's Plan",
    'Edit your daily study plan: per-subject targets, sub-blocks and ordering for the 16-hour goal.',
  );

  const { subjects, settings } = useStudy();
  const { editSubject, addSubject, deleteSubject, reorderSubject } = useStudyActions();
  const { start } = useTimerActions();
  const { activeSubjectId } = useTimerState();
  const toast = useToast();
  const progressMap = useAllSubjectProgress();
  const total = useSubjectTargetTotal();

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const ordered = useMemo(
    () => [...subjects].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [subjects],
  );

  const target = settings.dailyTargetMinutes;
  const diff = total - target;

  const bump = useCallback(
    (subject, delta) => {
      const next = Math.max(0, Math.min(1440, subject.targetMinutes + delta));
      if (next === subject.targetMinutes) return;
      editSubject(subject.id, { targetMinutes: next });
    },
    [editSubject],
  );

  const commitAdd = () => {
    const name = form.name.trim();
    if (!name) return;
    addSubject({ ...form, name });
    toast.success('Subject added', `${name} — ${formatMinutes(form.targetMinutes)} daily target.`);
    setForm(emptyForm);
    setAddOpen(false);
  };

  const commitEdit = () => {
    const name = editing.name.trim();
    if (!name) return;
    editSubject(editing.id, {
      name,
      iconKey: editing.iconKey,
      colorKey: editing.colorKey,
      targetMinutes: editing.targetMinutes,
    });
    toast.success('Subject updated', name);
    setEditing(null);
  };

  const commitDelete = () => {
    deleteSubject(toDelete.id);
    toast.info('Subject deleted', `${toDelete.name} and its tasks were removed.`);
    setToDelete(null);
  };

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Today&rsquo;s Plan</h1>
          <p className="page-sub">
            Tune each subject&rsquo;s daily target. Steps of 15 minutes.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setAddOpen(true)}>
          Add Subject
        </Button>
      </header>

      {ordered.length === 0 ? (
        <Card>
          <EmptyState
            icon={ListChecks}
            title="Your plan is empty"
            message="Add your first subject to start building the 16-hour day."
            actionLabel="Add Subject"
            onAction={() => setAddOpen(true)}
          />
        </Card>
      ) : (
        <ul className="list-reset stack" style={{ gap: 'var(--sp-3)' }}>
          {ordered.map((s, index) => {
            const Icon = getIcon(s.iconKey);
            const p = progressMap[s.id];
            return (
              <li key={s.id}>
                <article className="card">
                  <div className="row wrap" style={{ gap: 'var(--sp-3)', alignItems: 'flex-start' }}>
                    <span className={`subject-icon tone-${s.colorKey}`} aria-hidden="true">
                      <Icon size={21} />
                    </span>

                    <div className="grow" style={{ minWidth: 200 }}>
                      <div className="row-between">
                        <h2 style={{ fontSize: 'var(--fs-16)' }}>{s.name}</h2>
                        <span className="chip tnum">{p.percentInt}% today</span>
                      </div>
                      <p className="xsmall muted">
                        {formatMinutes(p.completed)} of {formatMinutes(s.targetMinutes)} done ·{' '}
                        {formatMinutes(p.remaining)} left
                      </p>
                      <div style={{ marginTop: 8 }}>
                        <ProgressBar percent={p.percent} size="sm" label={`${s.name}: ${p.percentInt}%`} />
                      </div>

                      {s.subBlocks?.length ? (
                        <ul className="subblock-list list-reset" style={{ marginTop: 10 }}>
                          {s.subBlocks.map((b) => (
                            <li key={b.name}>
                              <span className="truncate">↳ {b.name}</span>
                              <span className="tnum">{formatMinutes(b.targetMinutes)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>

                    <div className="row wrap" style={{ gap: 'var(--sp-2)' }}>
                      <div className="stepper">
                        <Button
                          size="sm" iconOnly icon={Minus}
                          onClick={() => bump(s, -STEP)}
                          aria-label={`Decrease ${s.name} target by 15 minutes`}
                          disabled={s.targetMinutes <= 0}
                        />
                        <output className="tnum">{formatMinutes(s.targetMinutes)}</output>
                        <Button
                          size="sm" iconOnly icon={Plus}
                          onClick={() => bump(s, STEP)}
                          aria-label={`Increase ${s.name} target by 15 minutes`}
                        />
                      </div>

                      <Button
                        size="sm"
                        variant={activeSubjectId === s.id ? 'secondary' : 'primary'}
                        icon={Play}
                        onClick={() => start(s.id)}
                        disabled={activeSubjectId === s.id}
                      >
                        {activeSubjectId === s.id ? 'Active' : 'Start'}
                      </Button>

                      <Button
                        size="sm" variant="ghost" iconOnly icon={ArrowUp}
                        onClick={() => reorderSubject(s.id, -1)}
                        disabled={index === 0}
                        aria-label={`Move ${s.name} up`}
                      />
                      <Button
                        size="sm" variant="ghost" iconOnly icon={ArrowDown}
                        onClick={() => reorderSubject(s.id, 1)}
                        disabled={index === ordered.length - 1}
                        aria-label={`Move ${s.name} down`}
                      />
                      <Button
                        size="sm" variant="ghost" iconOnly icon={Pencil}
                        onClick={() => setEditing({ ...s })}
                        aria-label={`Edit ${s.name}`}
                      />
                      <Button
                        size="sm" variant="ghost" iconOnly icon={Trash2}
                        onClick={() => setToDelete(s)}
                        aria-label={`Delete ${s.name}`}
                      />
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}

      {/* Total summary footer (§10.3) */}
      <Card className="section" title="Plan total">
        <div className="row-between wrap">
          <div>
            <p style={{ fontSize: 'var(--fs-24)', fontWeight: 750 }} className="tnum">
              {formatMinutes(total)}{' '}
              <span className="muted" style={{ fontSize: 'var(--fs-16)', fontWeight: 600 }}>
                / {formatMinutes(target)} daily target
              </span>
            </p>
            {diff === 0 ? (
              <p className="small row" style={{ color: 'var(--success)', gap: 6 }}>
                <CheckCircle2 size={15} aria-hidden="true" /> Subject targets match your daily goal exactly.
              </p>
            ) : (
              <p className="small row" style={{ color: 'var(--warning)', gap: 6 }}>
                <AlertTriangle size={15} aria-hidden="true" />
                {diff > 0
                  ? `${formatMinutes(diff)} over your daily target.`
                  : `${formatMinutes(-diff)} short of your daily target.`}
              </p>
            )}
          </div>
          <Button to="/settings" variant="ghost">
            Change daily target
          </Button>
        </div>
        <div style={{ marginTop: 'var(--sp-4)' }}>
          <ProgressBar
            percent={(total / Math.max(1, target)) * 100}
            size="lg"
            tone={diff === 0 ? 'success' : 'gradient'}
            label="Planned minutes against the daily target"
          />
        </div>
      </Card>

      {/* Add subject */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Subject"
        description="New subjects appear on the dashboard and in the timer immediately."
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={commitAdd} disabled={!form.name.trim()}>
              Add Subject
            </Button>
          </>
        }
      >
        <SubjectForm value={form} onChange={setForm} />
      </Modal>

      {/* Edit subject */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit Subject"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="primary" onClick={commitEdit} disabled={!editing?.name?.trim()}>
              Save changes
            </Button>
          </>
        }
      >
        {editing ? <SubjectForm value={editing} onChange={setEditing} /> : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onCancel={() => setToDelete(null)}
        onConfirm={commitDelete}
        danger
        title={`Delete ${toDelete?.name || 'subject'}?`}
        confirmLabel="Delete subject"
        message="Tasks for this subject are removed too. Past study sessions stay in your history."
      />
    </>
  );
}
