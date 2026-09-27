import { memo } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { NAV_ITEMS, BOTTOM_PRIMARY, MORE_ITEMS } from './navConfig.js';
import NavItemLink from './NavItemLink.jsx';
import { useLocation } from 'react-router-dom';

/** Mobile bottom navigation: Home · Plan · Timer · Analytics · More (§5.3). */
function BottomNav({ onOpenMore, moreOpen }) {
  const { pathname } = useLocation();
  const primaries = BOTTOM_PRIMARY.map((to) => NAV_ITEMS.find((i) => i.to === to)).filter(Boolean);
  const moreActive = MORE_ITEMS.some((i) => i.to === pathname);

  return (
    <nav className="bottom-nav" aria-label="Primary">
      <div className="bottom-nav-inner">
        {primaries.map((item) => (
          <NavItemLink key={item.to} item={item} className="bn-item">
            <span>{item.short}</span>
          </NavItemLink>
        ))}
        <button
          type="button"
          className={`bn-item${moreActive || moreOpen ? ' is-active' : ''}`}
          onClick={onOpenMore}
          aria-label="More destinations"
          aria-expanded={moreOpen}
          aria-haspopup="dialog"
        >
          <MoreHorizontal size={20} aria-hidden="true" />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}

export default memo(BottomNav);
