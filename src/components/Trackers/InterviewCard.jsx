import { memo, useState } from 'react';
import { ChevronDown, Plus, Trash2, Check, RotateCcw, Circle } from 'lucide-react';
import Button from '../common/Button.jsx';
import ProgressBar from '../common/ProgressBar.jsx';

const Q_STATUS = {
  pending: { label: 'Pending', cls: 'badge-neutral', icon: Circle },
  done: { label: 'Done', cls: 'badge-success', icon: Check },
  review: { label: 'Review', cls: 'badge-info', icon: RotateCcw },
};

const ORDER = ['pending', 'done', 'review'];
const next = (s) => ORDER[(ORDER.indexOf(s) + 1) % ORDER.length];

const Question = memo(function Question({ q, categoryId, onStatus, onNotes, onDelete }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(q.notes || '');
  const meta = Q_STATUS[q.status] || Q_STATUS.pending;
  const Icon = meta.icon;

  const save = () => {
    if (draft !== (q.notes || '')) onNotes(categoryId, q.id, draft);
  };

  return (
    <li style={{ borderBottom: '1px solid var(--border)', padding: 'var(--sp-2) 0' }}>
      <div className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
        <button
          type="button"
          className={`badge ${meta.cls}`}
          onClick={() => onStatus(categoryId, q.id, next(q.status))}
          style={{ border: 'none', cursor: 'pointer', minHeight: 30, flex: '0 0 auto' }}
          aria-label={`${meta.label}. Mark as ${Q_STATUS[next(q.status)].label}`}
        >
          <Icon size={12} aria-hidden="true" />
          {meta.label}
        </button>
        <span
          className="grow small"
          style={{
            textDecoration: q.status === 'done' ? 'line-through' : 'none',
            color: q.status === 'done' ? 'var(--muted)' : 'var(--text)',
          }}
        >
          {q.text}
        </span>
        <Button size="sm" variant="ghost" iconOnly icon={ChevronDown} onClick={() => setOpen((o) => !o)}
          aria-expanded={open} aria-label={`Notes for: ${q.text}`} />
        <Button size="sm" variant="ghost" iconOnly icon={Trash2} onClick={() => onDelete(categoryId, q.id)}
          aria-label={`Delete question: ${q.text}`} />
      </div>
      {open ? (
        <div style={{ marginTop: 8 }}>
          <label className="sr-only" htmlFor={`qn-${q.id}`}>Notes</label>
          <textarea
            id={`qn-${q.id}`}
            className="textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            placeholder="Your answer outline, keywords, follow-ups…"
          />
        </div>
      ) : null}
    </li>
  );
});

const InterviewCard = memo(function InterviewCard({
  category, onStatus, onNotes, onAdd, onDelete,
}) {
  const [open, setOpen] = useState(false);
  const [newQ, setNewQ] = useState('');

  const total = category.questions.length;
  const done = category.questions.filter((q) => q.status === 'done').length;
  const review = category.questions.filter((q) => q.status === 'review').length;
  const percent = total ? (done / total) * 100 : 0;

  const submit = (e) => {
    e.preventDefault();
    const value = newQ.trim();
    if (!value) return;
    onAdd(category.id, value);
    setNewQ('');
  };

  return (
    <article className="card">
      <div className="row-between" style={{ marginBottom: 'var(--sp-3)' }}>
        <h3 style={{ fontSize: 'var(--fs-16)' }}>{category.name}</h3>
        <span className="chip is-active tnum">{Math.round(percent)}%</span>
      </div>

      <ProgressBar percent={percent} label={`${category.name}: ${done} of ${total} done`} />

      <div className="row wrap xsmall muted" style={{ gap: 'var(--sp-3)', marginTop: 8 }}>
        <span>Total {total}</span>
        <span style={{ color: 'var(--success)' }}>Completed {done}</span>
        <span>Remaining {total - done}</span>
        {review > 0 ? <span style={{ color: 'var(--info)' }}>Review {review}</span> : null}
      </div>

      <Button
        variant="ghost"
        size="sm"
        icon={ChevronDown}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={`qs-${category.id}`}
        block
        style={{ marginTop: 'var(--sp-3)' }}
      >
        {open ? 'Hide questions' : `Show ${total} questions`}
      </Button>

      {open ? (
        <div id={`qs-${category.id}`} style={{ marginTop: 'var(--sp-3)' }}>
          <ul className="list-reset">
            {category.questions.map((q) => (
              <Question
                key={q.id}
                q={q}
                categoryId={category.id}
                onStatus={onStatus}
                onNotes={onNotes}
                onDelete={onDelete}
              />
            ))}
          </ul>
          <form className="row" onSubmit={submit} style={{ gap: 8, marginTop: 'var(--sp-3)' }}>
            <input
              className="input grow"
              placeholder="Add a question…"
              value={newQ}
              onChange={(e) => setNewQ(e.target.value)}
              aria-label={`New question for ${category.name}`}
              maxLength={200}
            />
            <Button size="sm" variant="secondary" iconOnly icon={Plus} type="submit"
              disabled={!newQ.trim()} aria-label="Add question" />
          </form>
        </div>
      ) : null}
    </article>
  );
});

export default InterviewCard;
