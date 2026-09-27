import { memo } from 'react';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import Button from '../common/Button.jsx';
import { formatShortDate } from '../../utils/dateUtils.js';
import { DSA_STATUSES } from '../../data/dsaTopics.js';

const DIFF_CLASS = { Easy: 'badge-easy', Medium: 'badge-medium', Hard: 'badge-hard' };
const STATUS_CLASS = {
  'not-started': 'badge-neutral',
  solved: 'badge-success',
  review: 'badge-info',
};

/** Table row (desktop) — memoised because the DSA list can get long. */
const ProblemRow = memo(function ProblemRow({ problem, onStatus, onEdit, onDelete }) {
  return (
    <tr>
      <td>
        <div style={{ fontWeight: 600 }}>{problem.title}</div>
        {problem.notes ? (
          <div className="xsmall muted truncate" style={{ maxWidth: 320 }}>
            {problem.notes}
          </div>
        ) : null}
      </td>
      <td>
        <span className="chip">{problem.topic}</span>
      </td>
      <td>
        <span className={`badge ${DIFF_CLASS[problem.difficulty] || 'badge-neutral'}`}>
          {problem.difficulty}
        </span>
      </td>
      <td>
        <label className="sr-only" htmlFor={`st-${problem.id}`}>
          Status for {problem.title}
        </label>
        <select
          id={`st-${problem.id}`}
          className="select"
          value={problem.status}
          onChange={(e) => onStatus(problem.id, e.target.value)}
          style={{ minWidth: 132, minHeight: 38 }}
        >
          {DSA_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </td>
      <td className="tnum small muted">{problem.date ? formatShortDate(problem.date) : '—'}</td>
      <td>
        <div className="row" style={{ gap: 4 }}>
          {problem.url ? (
            <Button
              size="sm" variant="ghost" iconOnly icon={ExternalLink}
              href={problem.url} target="_blank"
              aria-label={`Open ${problem.title} on LeetCode`}
            />
          ) : null}
          <Button
            size="sm" variant="ghost" iconOnly icon={Pencil}
            onClick={() => onEdit(problem)} aria-label={`Edit ${problem.title}`}
          />
          <Button
            size="sm" variant="ghost" iconOnly icon={Trash2}
            onClick={() => onDelete(problem)} aria-label={`Delete ${problem.title}`}
          />
        </div>
      </td>
    </tr>
  );
});

/** Card variant used below 900px (§12.1 — tables become responsive cards). */
export const ProblemCard = memo(function ProblemCard({ problem, onStatus, onEdit, onDelete }) {
  return (
    <li className="card" style={{ padding: 'var(--sp-3)' }}>
      <div className="row-between" style={{ marginBottom: 8, gap: 8 }}>
        <div className="grow" style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 650 }}>{problem.title}</div>
          <div className="xsmall muted">
            {problem.topic} · {problem.date ? formatShortDate(problem.date) : 'not attempted'}
          </div>
        </div>
        <span className={`badge ${DIFF_CLASS[problem.difficulty] || 'badge-neutral'}`}>
          {problem.difficulty}
        </span>
      </div>

      {problem.notes ? <p className="notes-box xsmall" style={{ marginBottom: 8 }}>{problem.notes}</p> : null}

      <div className="row wrap" style={{ gap: 8 }}>
        <label className="sr-only" htmlFor={`stc-${problem.id}`}>
          Status for {problem.title}
        </label>
        <select
          id={`stc-${problem.id}`}
          className="select grow"
          value={problem.status}
          onChange={(e) => onStatus(problem.id, e.target.value)}
          style={{ maxWidth: 170 }}
        >
          {DSA_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <span className={`badge ${STATUS_CLASS[problem.status]}`}>
          {DSA_STATUSES.find((s) => s.value === problem.status)?.label}
        </span>
        {problem.url ? (
          <Button size="sm" variant="ghost" iconOnly icon={ExternalLink} href={problem.url}
            target="_blank" aria-label={`Open ${problem.title}`} />
        ) : null}
        <Button size="sm" variant="ghost" iconOnly icon={Pencil} onClick={() => onEdit(problem)}
          aria-label={`Edit ${problem.title}`} />
        <Button size="sm" variant="ghost" iconOnly icon={Trash2} onClick={() => onDelete(problem)}
          aria-label={`Delete ${problem.title}`} />
      </div>
    </li>
  );
});

export default ProblemRow;
