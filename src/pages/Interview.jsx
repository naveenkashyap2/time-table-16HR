import { useMemo, useState } from 'react';
import { Search, MessagesSquare } from 'lucide-react';
import { useStudy, useStudyActions } from '../context/StudyContext.jsx';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import Card from '../components/common/Card.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ProgressBar from '../components/common/ProgressBar.jsx';
import InterviewCard from '../components/Trackers/InterviewCard.jsx';

export default function Interview() {
  useDocumentMeta(
    'Interview Prep',
    'Interview question bank across JavaScript, React, Node, databases, system design, GenAI and HR.',
  );

  const { interview } = useStudy();
  const { setQuestionStatus, setQuestionNotes, addQuestion, deleteQuestion } = useStudyActions();
  const [query, setQuery] = useState('');

  const totals = useMemo(() => {
    let total = 0;
    let done = 0;
    let review = 0;
    interview.forEach((c) =>
      c.questions.forEach((q) => {
        total += 1;
        if (q.status === 'done') done += 1;
        if (q.status === 'review') review += 1;
      }),
    );
    return { total, done, review, percent: total ? (done / total) * 100 : 0 };
  }, [interview]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return interview;
    return interview.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.questions.some((x) => x.text.toLowerCase().includes(q)),
    );
  }, [interview, query]);

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Interview Prep</h1>
          <p className="page-sub">
            {totals.done} of {totals.total} questions answered
            {totals.review > 0 ? ` · ${totals.review} to revise` : ''}
          </p>
        </div>
      </header>

      <Card title="Overall readiness">
        <div className="row-between" style={{ marginBottom: 'var(--sp-3)' }}>
          <span className="small muted">
            <strong className="tnum" style={{ color: 'var(--text)', fontSize: 'var(--fs-20)' }}>
              {totals.done}
            </strong>{' '}
            of {totals.total} questions completed
          </span>
          <span className="chip is-active tnum">{Math.round(totals.percent)}%</span>
        </div>
        <ProgressBar percent={totals.percent} size="lg" label="Interview questions completed" />
      </Card>

      <div className="toolbar section">
        <div className="search-wrap">
          <Search size={16} aria-hidden="true" />
          <input
            className="input"
            placeholder="Search categories and questions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search interview questions"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={MessagesSquare}
            title="No matching questions"
            message="Try a different search term."
            actionLabel="Clear search"
            onAction={() => setQuery('')}
          />
        </Card>
      ) : (
        <div className="subject-grid">
          {visible.map((c) => (
            <InterviewCard
              key={c.id}
              category={c}
              onStatus={setQuestionStatus}
              onNotes={setQuestionNotes}
              onAdd={addQuestion}
              onDelete={deleteQuestion}
            />
          ))}
        </div>
      )}
    </>
  );
}
