import { useState } from 'react';
import { Plus } from 'lucide-react';
import Button from '../common/Button.jsx';

/** Inline "add task" form: title + subject (§10.5). */
export default function AddTask({ subjects, defaultSubjectId, onAdd }) {
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(defaultSubjectId || subjects[0]?.id || '');

  const submit = (e) => {
    e.preventDefault();
    const value = title.trim();
    if (!value || !subjectId) return;
    onAdd({ title: value, subjectId });
    setTitle('');
  };

  if (subjects.length === 0) return null;

  return (
    <form className="toolbar" onSubmit={submit} style={{ marginBottom: 0 }}>
      <input
        className="input grow"
        placeholder="Add a task…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="New task title"
        maxLength={140}
      />
      {!defaultSubjectId ? (
        <select
          className="select"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          aria-label="Subject for the new task"
          style={{ maxWidth: 220 }}
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      ) : null}
      <Button variant="primary" icon={Plus} type="submit" disabled={!title.trim()}>
        Add
      </Button>
    </form>
  );
}
