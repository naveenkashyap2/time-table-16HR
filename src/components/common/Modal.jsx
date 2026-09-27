import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap.js';
import { useId } from 'react';

/**
 * Modal — focus-trapped, Esc to close, backdrop click to close,
 * role="dialog" + aria-modal + labelled title (§10.16, §12.2).
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}) {
  const titleId = useId();
  const descId = useId();
  const ref = useFocusTrap(open, onClose);

  if (!open) return null;

  return createPortal(
    <>
      <div
        className="modal-backdrop"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      <div className="modal-wrap">
        <div
          ref={ref}
          className={['modal', size === 'sm' ? 'modal-sm' : size === 'lg' ? 'modal-lg' : '']
            .filter(Boolean)
            .join(' ')}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
          tabIndex={-1}
        >
          <header className="modal-head">
            <div>
              <h2 id={titleId} style={{ fontSize: 'var(--fs-18)' }}>
                {title}
              </h2>
              {description ? (
                <p id={descId} className="small muted" style={{ marginTop: 4 }}>
                  {description}
                </p>
              ) : null}
            </div>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close dialog">
              <X size={20} />
            </button>
          </header>
          <div className="modal-body">{children}</div>
          {footer ? <div className="modal-foot">{footer}</div> : null}
        </div>
      </div>
    </>,
    document.body,
  );
}
