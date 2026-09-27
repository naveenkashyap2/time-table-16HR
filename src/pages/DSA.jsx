import { useCallback, useMemo, useState } from 'react';
import { Plus, Search, Binary, ListFilter, X } from 'lucide-react';
import { useStudy, useStudyActions } from '../context/StudyContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { usePagination } from '../hooks/usePagination.js';
import { useMediaQuery } from '../hooks/useMediaQuery.js';
import { DSA_TOPICS, DIFFICULTIES, DSA_STATUSES } from '../data/dsaTopics.js';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ProgressBar from '../components/common/ProgressBar.jsx';
import Pager from '../components/common/Pager.jsx';
import ProblemRow, { ProblemCard } from '../components/Trackers/ProblemRow.jsx';

const emptyForm = {
  title: '', topic: DSA_TOPICS[0], difficulty: 'Medium', status: 'not-started', notes: '', url: '',
};

function ProblemForm({ value, onChange }) {
  return (
    <>
      <div className="field">
        <label className="field-label" htmlFor="pf-title">Problem title</label>
        <input id="pf-title" className="input" value={value.title} data-autofocus
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          placeholder="e.g. Trapping Rain Water" maxLength={140} />
      </div>

      <div className="row wrap" style={{ gap: 'var(--sp-3)' }}>
        <div className="field grow">
          <label className="field-label" htmlFor="pf-topic">Topic</label>
          <select id="pf-topic" className="select" value={value.topic}
            onChange={(e) => onChange({ ...value, topic: e.target.value })}>
            {DSA_TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="field grow">
          <label className="field-label" htmlFor="pf-diff">Difficulty</label>
          <select id="pf-diff" className="select" value={value.difficulty}
            onChange={(e) => onChange({ ...value, difficulty: e.target.value })}>
            {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="field grow">
          <label className="field-label" htmlFor="pf-status">Status</label>
          <select id="pf-status" className="select" value={value.status}
            onChange={(e) => onChange({ ...value, status: e.target.value })}>
            {DSA_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="pf-url">LeetCode URL <span className="muted">(optional)</span></label>
        <input id="pf-url" className="input" type="url" value={value.url}
          onChange={(e) => onChange({ ...value, url: e.target.value })}
          placeholder="https://leetcode.com/problems/…" />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="pf-notes">Notes</label>
        <textarea id="pf-notes" className="textarea" value={value.notes}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          placeholder="Pattern used, time complexity, what tripped you up…" />
      </div>
    </>
  );
}

export default function DSA() {
  useDocumentMeta(
    'DSA Tracker',
    'Track every data structures and algorithms problem: topic, difficulty, status, notes and solve rate.',
  );

  const { dsa } = useStudy();
  const { addProblem, editProblem, deleteProblem, setProblemStatus } = useStudyActions();
  const toast = useToast();
  const isNarrow = useMediaQuery('(max-width: 900px)');

  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [status, setStatus] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const stats = useMemo(() => {
    const solved = dsa.filter((p) => p.status === 'solved');
    const byDiff = { Easy: 0, Medium: 0, Hard: 0 };
    solved.forEach((p) => {
      byDiff[p.difficulty] = (byDiff[p.difficulty] || 0) + 1;
    });
    return {
      total: dsa.length,
      solved: solved.length,
      review: dsa.filter((p) => p.status === 'review').length,
      remaining: dsa.filter((p) => p.status === 'not-started').length,
      byDiff,
      percent: dsa.length ? (solved.length / dsa.length) * 100 : 0,
    };
  }, [dsa]);

  const topicProgress = useMemo(
    () =>
      DSA_TOPICS.map((t) => {
        const list = dsa.filter((p) => p.topic === t);
        const solved = list.filter((p) => p.status === 'solved').length;
        return { topic: t, total: list.length, solved };
      }),
    [dsa],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dsa.filter(
      (p) =>
        (topic === 'all' || p.topic === topic) &&
        (difficulty === 'all' || p.difficulty === difficulty) &&
        (status === 'all' || p.status === status) &&
        (!q || p.title.toLowerCase().includes(q) || (p.notes || '').toLowerCase().includes(q)),
    );
  }, [dsa, query, topic, difficulty, status]);

  const pager = usePagination(filtered, 25);
  const hasFilters = query || topic !== 'all' || difficulty !== 'all' || status !== 'all';

  const clearFilters = () => {
    setQuery(''); setTopic('all'); setDifficulty('all'); setStatus('all');
  };

  const onStatus = useCallback(
    (id, next) => {
      setProblemStatus(id, next);
      if (next === 'solved') {
        const p = dsa.find((x) => x.id === id);
        toast.success('Problem solved', p?.title || 'Nice one.');
      }
    },
    [setProblemStatus, dsa, toast],
  );

  const commitAdd = () => {
    const title = form.title.trim();
    if (!title) return;
    addProblem({ ...form, title });
    toast.success('Problem added', title);
    setForm(emptyForm);
    setAddOpen(false);
  };

  const commitEdit = () => {
    const title = editing.title.trim();
    if (!title) return;
    const { id, ...patch } = editing;
    editProblem(id, { ...patch, title });
    toast.success('Problem updated', title);
    setEditing(null);
  };

  return (
    <>
      <header className="page-head">
        <div>
          <h1>DSA Tracker</h1>
          <p className="page-sub">
            {stats.solved} solved · {stats.review} in review · {stats.remaining} not started
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setAddOpen(true)}>
          Add Problem
        </Button>
      </header>

      <div className="stat-grid stat-grid-4">
        <article className="stat-card">
          <span className="stat-label">Total</span>
          <span className="stat-value tnum">{stats.total}</span>
          <span className="stat-sub">problems tracked</span>
        </article>
        <article className="stat-card" data-tone="success">
          <span className="stat-label">Solved</span>
          <span className="stat-value tnum">{stats.solved}</span>
          <span className="stat-sub">{Math.round(stats.percent)}% of the list</span>
        </article>
        <article className="stat-card" data-tone="accent">
          <span className="stat-label">Remaining</span>
          <span className="stat-value tnum">{stats.remaining}</span>
          <span className="stat-sub">{stats.review} marked for review</span>
        </article>
        <article className="stat-card" data-tone="secondary">
          <span className="stat-label">By difficulty</span>
          <span className="stat-value" style={{ fontSize: 'var(--fs-18)' }}>
            <span className="badge badge-easy">E {stats.byDiff.Easy}</span>{' '}
            <span className="badge badge-medium">M {stats.byDiff.Medium}</span>{' '}
            <span className="badge badge-hard">H {stats.byDiff.Hard}</span>
          </span>
          <span className="stat-sub">solved breakdown</span>
        </article>
      </div>

      <Card className="section" title="Solve rate">
        <ProgressBar
          percent={stats.percent}
          size="lg"
          label={`${stats.solved} of ${stats.total} problems solved`}
        />
        <p className="small muted" style={{ marginTop: 8 }}>
          {stats.solved} of {stats.total} problems solved
        </p>
      </Card>

      <section className="section" aria-labelledby="topics-heading">
        <div className="section-head">
          <h2 id="topics-heading">Topics</h2>
        </div>
        <div className="row wrap">
          {topicProgress.map((t) => (
            <button
              key={t.topic}
              type="button"
              className={`chip chip-btn${topic === t.topic ? ' is-active' : ''}`}
              onClick={() => setTopic(topic === t.topic ? 'all' : t.topic)}
              aria-pressed={topic === t.topic}
            >
              {t.topic}
              <span className="tnum" style={{ opacity: 0.75 }}>
                {t.solved}/{t.total}
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="toolbar section">
        <div className="search-wrap">
          <Search size={16} aria-hidden="true" />
          <input
            className="input"
            placeholder="Search problems…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search problems"
          />
        </div>
        <label className="sr-only" htmlFor="f-topic">Filter by topic</label>
        <select id="f-topic" className="select" value={topic} onChange={(e) => setTopic(e.target.value)} style={{ maxWidth: 190 }}>
          <option value="all">All topics</option>
          {DSA_TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <label className="sr-only" htmlFor="f-diff">Filter by difficulty</label>
        <select id="f-diff" className="select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="all">All difficulties</option>
          {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <label className="sr-only" htmlFor="f-status">Filter by status</label>
        <select id="f-status" className="select" value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="all">All statuses</option>
          {DSA_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {hasFilters ? (
          <Button variant="ghost" icon={X} onClick={clearFilters}>Clear</Button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={hasFilters ? ListFilter : Binary}
            title={hasFilters ? 'No problems match those filters' : 'No problems yet'}
            message={
              hasFilters
                ? 'Try widening your search or clearing the filters.'
                : 'Add your first DSA problem to start tracking your solve rate.'
            }
            actionLabel={hasFilters ? 'Clear filters' : 'Add Problem'}
            onAction={hasFilters ? clearFilters : () => setAddOpen(true)}
          />
        </Card>
      ) : isNarrow ? (
        <ul className="list-reset stack" style={{ gap: 'var(--sp-2)' }}>
          {pager.slice.map((p) => (
            <ProblemCard key={p.id} problem={p} onStatus={onStatus} onEdit={setEditing} onDelete={setToDelete} />
          ))}
        </ul>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <caption className="sr-only">DSA problems with topic, difficulty, status and date</caption>
            <thead>
              <tr>
                <th scope="col">Problem</th>
                <th scope="col">Topic</th>
                <th scope="col">Difficulty</th>
                <th scope="col">Status</th>
                <th scope="col">Date</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pager.slice.map((p) => (
                <ProblemRow key={p.id} problem={p} onStatus={onStatus} onEdit={setEditing} onDelete={setToDelete} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pager {...pager} onPrev={pager.prev} onNext={pager.next} unit="problems" />

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Problem"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={commitAdd} disabled={!form.title.trim()}>Add problem</Button>
          </>
        }
      >
        <ProblemForm value={form} onChange={setForm} />
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit Problem"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="primary" onClick={commitEdit} disabled={!editing?.title?.trim()}>Save changes</Button>
          </>
        }
      >
        {editing ? <ProblemForm value={editing} onChange={setEditing} /> : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          deleteProblem(toDelete.id);
          toast.info('Problem deleted', toDelete.title);
          setToDelete(null);
        }}
        danger
        title="Delete this problem?"
        confirmLabel="Delete problem"
        message={toDelete ? `"${toDelete.title}" will be removed from your tracker.` : ''}
      />
    </>
  );
}
