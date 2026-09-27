import { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { prefetchRoute } from '../../router/pageLoaders.js';

/**
 * Nav link with prefetch-on-intent (§5.4): pointer-enter / focus fires the
 * route's dynamic import early so navigation feels instant.
 */
const NavItemLink = memo(function NavItemLink({ item, className = 'nav-link', onNavigate, children }) {
  const { to, label, icon: Icon, end } = item;
  const warm = () => prefetchRoute(to);

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `${className}${isActive ? ' is-active' : ''}`}
      onPointerEnter={warm}
      onFocus={warm}
      onTouchStart={warm}
      onClick={onNavigate}
      aria-current={undefined}
    >
      {({ isActive }) => (
        <>
          <Icon size={20} aria-hidden="true" />
          {children ?? <span className="nav-label">{label}</span>}
          {isActive ? <span className="sr-only">(current page)</span> : null}
        </>
      )}
    </NavLink>
  );
});

export default NavItemLink;
