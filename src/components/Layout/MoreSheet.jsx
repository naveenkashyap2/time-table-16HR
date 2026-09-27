import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { MORE_ITEMS } from './navConfig.js';
import { prefetchRoute } from '../../router/pageLoaders.js';
import { useFocusTrap } from '../../hooks/useFocusTrap.js';

/** Bottom sheet holding every destination not in the bottom nav (§5.3). */
export default function MoreSheet({ open, onClose }) {
  const ref = useFocusTrap(open, onClose);
  if (!open) return null;

  return createPortal(
    <>
      <div className="sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="More destinations"
        tabIndex={-1}
      >
        <div className="sheet-grab" aria-hidden="true" />
        <h2 style={{ fontSize: 'var(--fs-16)', marginBottom: 'var(--sp-4)' }}>More</h2>
        <div className="sheet-grid">
          {MORE_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              onPointerEnter={() => prefetchRoute(to)}
              onFocus={() => prefetchRoute(to)}
              className={({ isActive }) => `sheet-tile${isActive ? ' is-active' : ''}`}
            >
              <Icon size={22} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </>,
    document.body,
  );
}
