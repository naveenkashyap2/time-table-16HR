import { memo, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, Sun, Moon, Trash2, Flame, Trophy, CheckCircle2 } from 'lucide-react';
import { titleForPath } from './navConfig.js';
import LiveClock from './LiveClock.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useStudy, useStudyActions } from '../../context/StudyContext.jsx';
import { formatLongDate } from '../../utils/dateUtils.js';
import Button from '../common/Button.jsx';

const KIND_ICON = { achievement: Trophy, streak: Flame, session: CheckCircle2 };

function NotificationBell() {
  const { notifications } = useStudy();
  const { clearNotifications, markNotificationsRead } = useStudyActions();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    setOpen((o) => {
      if (!o && unread > 0) markNotificationsRead();
      return !o;
    });
  };

  return (
    <div className="nav-pop-wrap" ref={wrapRef}>
      <button
        type="button"
        className="icon-btn"
        onClick={toggle}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell size={20} />
        {unread > 0 ? (
          <span className="badge-dot" aria-hidden="true">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="popover" role="dialog" aria-label="Notifications">
          <div className="popover-head">
            <span>Notifications</span>
            {notifications.length > 0 ? (
              <Button size="sm" variant="ghost" icon={Trash2} onClick={clearNotifications}>
                Clear all
              </Button>
            ) : null}
          </div>
          <div className="popover-body">
            {notifications.length === 0 ? (
              <p className="popover-item muted small" style={{ justifyContent: 'center' }}>
                No notifications yet — start a session to see updates here.
              </p>
            ) : (
              notifications.map((n) => {
                const Icon = KIND_ICON[n.kind] || Bell;
                return (
                  <div className="popover-item" key={n.id}>
                    <span className="pi-icon" aria-hidden="true">
                      <Icon size={16} />
                    </span>
                    <div className="grow">
                      <div style={{ fontWeight: 600 }}>{n.title}</div>
                      {n.body ? <div className="muted xsmall">{n.body}</div> : null}
                      <div className="muted xsmall" style={{ marginTop: 2 }}>
                        {new Date(n.at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      className="icon-btn"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={isDark}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

function Navbar({ onOpenDrawer }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { settings } = useStudy();
  const title = titleForPath(pathname);
  const initials = (settings.userName || 'N')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="navbar">
      <button
        type="button"
        className="icon-btn"
        onClick={onOpenDrawer}
        aria-label="Open navigation menu"
        style={{ display: 'var(--hamburger-display, grid)' }}
        data-hamburger
      >
        <Menu size={22} />
      </button>

      <div className="navbar-title grow">
        <strong className="truncate">{title}</strong>
        <span className="navbar-date truncate">{formatLongDate()}</span>
      </div>

      <div className="row" style={{ gap: 4 }}>
        <span data-desktop-only>
          <LiveClock />
        </span>
        <ThemeToggle />
        <NotificationBell />
        <button
          type="button"
          className="avatar-btn"
          onClick={() => navigate('/settings')}
          aria-label={`Open settings for ${settings.userName || 'you'}`}
          title="Settings"
        >
          {initials}
        </button>
      </div>
    </header>
  );
}

export default memo(Navbar);
