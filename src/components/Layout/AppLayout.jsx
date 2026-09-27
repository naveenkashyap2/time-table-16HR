import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import BottomNav from './BottomNav.jsx';
import MobileDrawer from './MobileDrawer.jsx';
import MoreSheet from './MoreSheet.jsx';
import ActiveTimerBanner from '../Timer/ActiveTimerBanner.jsx';
import TimerSwitchModal from '../Timer/TimerSwitchModal.jsx';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import { useMediaQuery } from '../../hooks/useMediaQuery.js';
import { useStreak } from '../../hooks/useStreak.js';
import { useStudy, useStudyActions } from '../../context/StudyContext.jsx';
import { todayKey } from '../../utils/dateUtils.js';
import { formatMinutes } from '../../utils/formatTime.js';

/** Fires a single streak-warning notification per day, after 18:00. */
function useStreakWarning() {
  const { settings, notifications } = useStudy();
  const { addNotification } = useStudyActions();
  const { atRisk, minutesToKeepStreak, currentStreak } = useStreak();

  useEffect(() => {
    if (!settings.notifications?.streakWarning) return;
    if (!atRisk || currentStreak < 1) return;
    if (new Date().getHours() < 18) return;

    const key = todayKey();
    const already = notifications.some((n) => n.kind === 'streak' && n.dayKey === key);
    if (already) return;

    addNotification({
      kind: 'streak',
      dayKey: key,
      title: 'Streak at risk',
      body: `${formatMinutes(minutesToKeepStreak)} left today to keep your ${currentStreak}-day streak.`,
    });
  }, [atRisk, currentStreak, minutesToKeepStreak, notifications, settings.notifications, addNotification]);
}

export default function AppLayout() {
  const [rail, setRail] = useLocalStorage('sl_ui_rail', false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

  useStreakWarning();

  // Close overlays whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  // Tablet defaults to the icon rail (§5.3).
  useEffect(() => {
    if (isTablet) setRail(true);
  }, [isTablet, setRail]);

  const toggleRail = useCallback(() => setRail((v) => !v), [setRail]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <Sidebar rail={rail} onToggleRail={toggleRail} />

      <div className="app-main">
        <Navbar onOpenDrawer={() => setDrawerOpen(true)} />

        <main id="main-content" className="page-wrap route-fade" key={pathname} tabIndex={-1}>
          <Outlet />
        </main>

        <ActiveTimerBanner />
        <Footer />
      </div>

      <BottomNav onOpenMore={() => setMoreOpen(true)} moreOpen={moreOpen} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
      <TimerSwitchModal />
    </div>
  );
}
