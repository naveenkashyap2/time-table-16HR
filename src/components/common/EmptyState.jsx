import { Inbox } from 'lucide-react';
import Button from './Button.jsx';

/** Empty states everywhere (§10.16): icon + message + guiding CTA. */
export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  message,
  actionLabel,
  onAction,
  actionTo,
  compact = false,
}) {
  return (
    <div className="empty-state" style={compact ? { padding: '24px 16px' } : undefined}>
      <div className="empty-icon" aria-hidden="true">
        <Icon size={26} />
      </div>
      <h3>{title}</h3>
      {message ? <p>{message}</p> : null}
      {actionLabel && (onAction || actionTo) ? (
        <Button variant="primary" onClick={onAction} to={actionTo}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
