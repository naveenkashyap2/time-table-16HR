import { createPortal } from 'react-dom';
import { X, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NAV_ITEMS, NAV_GROUPS } from './navConfig.js';
import NavItemLink from './NavItemLink.jsx';
import { useFocusTrap } from '../../hooks/useFocusTrap.js';
import { useStreak } from '../../hooks/useStreak.js';

/** Full link list drawer (secondary nav on mobile/tablet — §5.3). */
export default function MobileDrawer({ open, onClose }) {
  const ref = useFocusTrap(open, onClose);
  const { currentStreak } = useStreak();

  if (!open) return null;

  return createPortal(
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        tabIndex={-1}
      >
        <div className="sidebar-brand" style={{ justifyContent: 'space-between' }}>
          <Link to="/" className="row" onClick={onClose} style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className="brand-mark" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeDasharray="38 13" transform="rotate(-90 12 12)" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
              </svg>
            </span>
            <span className="brand-text">
              <strong>StudyLoop</strong>
              <span>16 Hours. Every Day.</span>
            </span>
          </Link>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close menu" data-autofocus>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="All pages">
          {NAV_GROUPS.map((group) => {
            const items = NAV_ITEMS.filter((i) => i.group === group);
            return (
              <div key={group}>
                <div className="nav-group-label">{group}</div>
                <ul className="list-reset">
                  {items.map((item) => (
                    <li key={item.to}>
                      <NavItemLink item={item} onNavigate={onClose} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        {currentStreak > 0 ? (
          <div className="sidebar-foot">
            <div className="mini-row" style={{ justifyContent: 'center', gap: 6 }}>
              <Flame size={16} style={{ color: 'var(--accent)' }} aria-hidden="true" />
              <span className="small">
                <strong>{currentStreak}</strong> day streak
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </>,
    document.body,
  );
}
