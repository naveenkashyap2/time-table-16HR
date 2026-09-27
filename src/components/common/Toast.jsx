import { memo } from 'react';
import { CheckCircle2, Info, AlertTriangle, Trophy, X } from 'lucide-react';
import { useToast, useToasts } from '../../context/ToastContext.jsx';

const ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
  achievement: Trophy,
};

const Toast = memo(function Toast({ toast, onDismiss }) {
  const Icon = ICONS[toast.type] || Info;
  return (
    <div className="toast" data-type={toast.type}>
      <span className="toast-icon" aria-hidden="true">
        <Icon size={20} />
      </span>
      <div className="grow">
        {toast.title ? <div className="toast-title">{toast.title}</div> : null}
        {toast.message ? <div className="toast-msg">{toast.message}</div> : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--muted)',
          padding: 2,
          lineHeight: 0,
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
});

/** Live region for all toasts (§10.16). */
export default function ToastRegion() {
  const toasts = useToasts();
  const { dismiss } = useToast();

  return (
    <div className="toast-region" role="status" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  );
}
