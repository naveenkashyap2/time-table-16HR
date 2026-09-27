import { memo } from 'react';
import { Link } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, Flame } from 'lucide-react';
import { NAV_ITEMS, NAV_GROUPS } from './navConfig.js';
import NavItemLink from './NavItemLink.jsx';
import { useStreak } from '../../hooks/useStreak.js';

/**
 * Desktop (>=1024): permanent sidebar.
 * Tablet (768–1023) is handled by AppLayout (rail / drawer).
 */
function Sidebar({ rail, onToggleRail }) {
  const { currentStreak } = useStreak();

  return (
    <aside className="sidebar" data-rail={rail ? 'true' : 'false'}>
      <Link to="/" className="sidebar-brand" aria-label="StudyLoop home">
        <span className="brand-mark" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle
              cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeDasharray="38 13" transform="rotate(-90 12 12)"
            />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </svg>
        </span>
        <span className="brand-text">
          <strong>StudyLoop</strong>
          <span>16 Hours. Every Day.</span>
        </span>
      </Link>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {NAV_GROUPS.map((group) => {
          const items = NAV_ITEMS.filter((i) => i.group === group);
          if (items.length === 0) return null;
          return (
            <div key={group}>
              <div className="nav-group-label">{group}</div>
              <ul className="list-reset">
                {items.map((item) => (
                  <li key={item.to}>
                    <NavItemLink item={item} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-foot">
        {!rail && currentStreak > 0 ? (
          <div
            className="mini-row"
            style={{ marginBottom: 8, justifyContent: 'center', gap: 6 }}
          >
            <Flame size={16} style={{ color: 'var(--accent)' }} aria-hidden="true" />
            <span className="small">
              <strong>{currentStreak}</strong> day streak
            </span>
          </div>
        ) : null}
        <button
          type="button"
          className="rail-toggle"
          onClick={onToggleRail}
          aria-label={rail ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!rail}
        >
          {rail ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          <span className="sidebar-foot-text">{rail ? '' : 'Collapse'}</span>
        </button>
      </div>
    </aside>
  );
}

export default memo(Sidebar);
