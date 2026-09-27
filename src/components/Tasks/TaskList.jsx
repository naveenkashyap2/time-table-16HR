import { memo } from 'react';
import TaskItem from './TaskItem.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { CheckSquare } from 'lucide-react';

function TaskList({ tasks, doneIds, onToggle, onEdit, onDelete, subjectNames, emptyMessage }) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        compact
        icon={CheckSquare}
        title="No tasks yet"
        message={emptyMessage || 'Add your first task to start checking things off today.'}
      />
    );
  }

  return (
    <ul className="list-reset task-list">
      {tasks.map((t) => (
        <TaskItem
          key={t.id}
          task={t}
          done={doneIds.has(t.id)}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          subjectName={subjectNames?.[t.subjectId]}
        />
      ))}
    </ul>
  );
}

export default memo(TaskList);
