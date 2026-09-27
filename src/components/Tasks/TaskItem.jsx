import { memo, useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import Button from '../common/Button.jsx';

/** One task row with inline edit + today's checkbox (§10.5). */
function TaskItem({ task, done, onToggle, onEdit, onDelete, subjectName }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);

  const save = () => {
    const value = draft.trim();
    if (value && value !== task.title) onEdit(task.id, { title: value });
    setEditing(false);
  };

  const cancel = () => {
    setDraft(task.title);
    setEditing(false);
  };

  if (editing) {
    return (
      <li className="task-item">
        <input
          className="input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') cancel();
          }}
          aria-label={`Edit task: ${task.title}`}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
        <Button size="sm" variant="primary" iconOnly icon={Check} onClick={save} aria-label="Save task" />
        <Button size="sm" variant="ghost" iconOnly icon={X} onClick={cancel} aria-label="Cancel editing" />
      </li>
    );
  }

  return (
    <li className="task-item" data-done={done}>
      <input
        type="checkbox"
        className="checkbox"
        checked={done}
        onChange={() => onToggle(task.id)}
        id={`task-${task.id}`}
      />
      <label htmlFor={`task-${task.id}`} className="task-title grow">
        {task.title}
        {subjectName ? <span className="xsmall muted"> · {subjectName}</span> : null}
      </label>
      <Button
        size="sm"
        variant="ghost"
        iconOnly
        icon={Pencil}
        onClick={() => setEditing(true)}
        aria-label={`Edit task: ${task.title}`}
      />
      <Button
        size="sm"
        variant="ghost"
        iconOnly
        icon={Trash2}
        onClick={() => onDelete(task)}
        aria-label={`Delete task: ${task.title}`}
      />
    </li>
  );
}

export default memo(TaskItem);
