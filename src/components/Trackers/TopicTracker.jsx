import { memo, useCallback, useMemo, useState } from 'react';
import {
  Circle, BookOpen, CheckCircle2, RotateCcw, ChevronDown, Plus, Trash2, Search,
} from 'lucide-react';
import { useStudy, useStudyActions } from '../../context/StudyContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatShortDate } from '../../utils/dateUtils.js';
import Card from '../common/Card.jsx';
import Button from '../common/Button.jsx';
import ProgressBar from '../common/ProgressBar.jsx';
import EmptyState from '../common/EmptyState.jsx';
import ConfirmDialog from '../common/ConfirmDialog.jsx';

/** 4-state cycle (§10.9). Status is never colour-only — always icon + text. */
export const STATUS_CYCLE = ['not-started', 'learning', 'completed', 'review'];

export const STATUS_META = {
  'not-started': { label: 'Not Started', icon: Circle, badge: 'badge-neutral' },
  learning: { label: 'Learning', badge: 'badge-warning', icon: BookOpen },
  completed: { label: 'Completed', badge: 'badge-success', icon: CheckCircle2 },
  review: { label: 'Review', badge: 'badge-info', icon: RotateCcw },
};

const nextStatus = (s) => STATUS_CYCLE[(STATUS_CYCLE.indexOf(s) + 1) % STATUS_CYCLE.length];

const TopicRow = memo(function TopicRow({ topic, onCycle, onNotes, onDelete }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(topic.notes || '');
  const meta = STATUS_META[topic.status] || STATUS_META['not-started'];
  const Icon = meta.icon;

  const saveNotes = () => {
    if (draft !== (topic.notes || '')) onNotes(topic.id, draft);
  };

  return (
    <li className="card" style={{ padding: 'var(--sp-3)' }}>
      <div className="row wrap" style={{ gap: 'var(--sp-3)' }}>
        <button
          type="button"
          onClick={() => onCycle(topic)}
          className={`badge ${meta.badge}`}
          style={{ minHeight: 34, padding: '6px 12px', border: 'none', cursor: 'pointer' }}
          aria-label={`${topic.name} is ${meta.label}. Change to ${
            STATUS_META[nextStatus(topic.status)].label
          }`}
        >
          <Icon size={14} aria-hidden="true" />
          {meta.label}
        </button>

        <div className="grow" style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600 }}>{topic.name}</div>
          {topic.updatedAt ? (
            <div className="xsmall muted">Updated {formatShortDate(topic.updatedAt)}</div>
          ) : null}
        </div>

        <Button
          size="sm"
          variant="ghost"
          icon={ChevronDown}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={`notes-${topic.id}`}
        >
          Notes{topic.notes ? ' •' : ''}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          iconOnly
          icon={Trash2}
          onClick={() => onDelete(topic)}
          aria-label={`Delete topic ${topic.name}`}
        />
      </div>

      {open ? (
        <div id={`notes-${topic.id}`} style={{ marginTop: 'var(--sp-3)' }}>
          <label className="sr-only" htmlFor={`ta-${topic.id}`}>
            Notes for {topic.name}
          </label>
          <textarea
            id={`ta-${topic.id}`}
            className="textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={saveNotes}
            placeholder="Key ideas, links, gotchas…"
          />
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
            <Button size="sm" variant="secondary" onClick={saveNotes}>
              Save notes
            </Button>
          </div>
        </div>
      ) : null}
    </li>
  );
});

/**
 * One code path, three datasets (§10.9).
 * @param {'sd'|'dotnet'|'rn'} tracker
 */
function TopicTracker({ tracker, slice }) {
  const state = useStudy();
  const { setTopicStatus, setTopicNotes, addTopic, deleteTopic } = useStudyActions();
  const toast = useToast();
  const topics = state[slice] || [];

  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [toDelete, setToDelete] = useState(null);

  const counts = useMemo(() => {
    const c = { 'not-started': 0, learning: 0, completed: 0, review: 0 };
    topics.forEach((t) => {
      c[t.status] = (c[t.status] || 0) + 1;
    });
    return c;
  }, [topics]);

  const percent = topics.length ? (counts.completed / topics.length) * 100 : 0;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return topics.filter(
      (t) =>
        (filter === 'all' || t.status === filter) &&
        (!q || t.name.toLowerCase().includes(q)),
    );
  }, [topics, filter, query]);

  const cycle = useCallback(
    (topic) => {
      const next = nextStatus(topic.status);
      setTopicStatus(tracker, topic.id, next);
      if (next === 'completed') {
        toast.success('Topic completed', topic.name);
      }
    },
    [setTopicStatus, tracker, toast],
  );

  const onNotes = useCallback(
    (id, notes) => setTopicNotes(tracker, id, notes),
    [setTopicNotes, tracker],
  );

  const submitNew = (e) => {
    e.preventDefault();
    const name = newTopic.trim();
    if (!name) return;
    addTopic(tracker, name);
    toast.success('Topic added', name);
    setNewTopic('');
  };

  return (
    <>
      <Card title="Overall progress">
        <div className="row-between" style={{ marginBottom: 'var(--sp-3)' }}>
          <span className="small muted">
            <strong className="tnum" style={{ color: 'var(--text)', fontSize: 'var(--fs-20)' }}>
              {counts.completed}
            </strong>{' '}
            of {topics.length} topics completed
          </span>
          <span className="chip is-active tnum">{Math.round(percent)}%</span>
        </div>
        <ProgressBar percent={percent} size="lg" label="Topics completed" />

        <div className="row wrap" style={{ marginTop: 'var(--sp-4)' }}>
          {STATUS_CYCLE.map((s) => {
            const meta = STATUS_META[s];
            const Icon = meta.icon;
            return (
              <span key={s} className={`badge ${meta.badge}`}>
                <Icon size={13} aria-hidden="true" />
                {meta.label}: {counts[s] || 0}
              </span>
            );
          })}
        </div>
      </Card>

      <div className="toolbar section">
        <div className="search-wrap">
          <Search size={16} aria-hidden="true" />
          <input
            className="input"
            placeholder="Search topics…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search topics"
          />
        </div>
        <button
          type="button"
          className={`chip chip-btn${filter === 'all' ? ' is-active' : ''}`}
          onClick={() => setFilter('all')}
          aria-pressed={filter === 'all'}
        >
          All ({topics.length})
        </button>
        {STATUS_CYCLE.map((s) => (
          <button
            key={s}
            type="button"
            className={`chip chip-btn${filter === s ? ' is-active' : ''}`}
            onClick={() => setFilter(s)}
            aria-pressed={filter === s}
          >
            {STATUS_META[s].label} ({counts[s] || 0})
          </button>
        ))}
      </div>

      <form className="toolbar" onSubmit={submitNew}>
        <input
          className="input grow"
          placeholder="Add a custom topic…"
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          aria-label="New topic name"
          maxLength={90}
        />
        <Button variant="primary" icon={Plus} type="submit" disabled={!newTopic.trim()}>
          Add topic
        </Button>
      </form>

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={BookOpen}
            title={topics.length === 0 ? 'No topics yet' : 'Nothing matches that filter'}
            message={
              topics.length === 0
                ? 'Add your first topic above to start tracking this syllabus.'
                : 'Try a different status filter or clear your search.'
            }
            actionLabel={topics.length > 0 ? 'Clear filters' : undefined}
            onAction={
              topics.length > 0
                ? () => {
                    setFilter('all');
                    setQuery('');
                  }
                : undefined
            }
          />
        </Card>
      ) : (
        <ul className="list-reset stack" style={{ gap: 'var(--sp-2)' }}>
          {visible.map((t) => (
            <TopicRow
              key={t.id}
              topic={t}
              onCycle={cycle}
              onNotes={onNotes}
              onDelete={setToDelete}
            />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          deleteTopic(tracker, toDelete.id);
          toast.info('Topic removed', toDelete.name);
          setToDelete(null);
        }}
        danger
        title="Delete this topic?"
        confirmLabel="Delete topic"
        message={toDelete ? `"${toDelete.name}" and its notes will be removed.` : ''}
      />
    </>
  );
}

export default memo(TopicTracker);
