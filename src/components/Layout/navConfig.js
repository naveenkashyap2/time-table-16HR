import {
  LayoutDashboard, ListChecks, Timer, CheckSquare, Binary, FolderKanban,
  MessagesSquare, Network, Hash, Smartphone, BarChart3, CalendarDays,
  Trophy, Settings as SettingsIcon,
} from 'lucide-react';

/** Every destination in the app, with its skeleton variant and meta. */
export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', short: 'Home', icon: LayoutDashboard, group: 'Daily', end: true, skeleton: 'dashboard' },
  { to: '/plan', label: "Today's Plan", short: 'Plan', icon: ListChecks, group: 'Daily', skeleton: 'list' },
  { to: '/timer', label: 'Study Timer', short: 'Timer', icon: Timer, group: 'Daily', skeleton: 'timer' },
  { to: '/tasks', label: 'Tasks', short: 'Tasks', icon: CheckSquare, group: 'Daily', skeleton: 'list' },

  { to: '/dsa', label: 'DSA Tracker', short: 'DSA', icon: Binary, group: 'Trackers', skeleton: 'table' },
  { to: '/projects', label: 'Projects', short: 'Projects', icon: FolderKanban, group: 'Trackers', skeleton: 'grid' },
  { to: '/interview', label: 'Interview Prep', short: 'Interview', icon: MessagesSquare, group: 'Trackers', skeleton: 'grid' },
  { to: '/system-design', label: 'System Design', short: 'Sys Design', icon: Network, group: 'Trackers', skeleton: 'list' },
  { to: '/dotnet', label: '.NET / C#', short: '.NET', icon: Hash, group: 'Trackers', skeleton: 'list' },
  { to: '/react-native', label: 'React Native', short: 'RN', icon: Smartphone, group: 'Trackers', skeleton: 'list' },

  { to: '/analytics', label: 'Analytics', short: 'Stats', icon: BarChart3, group: 'Insights', skeleton: 'analytics' },
  { to: '/calendar', label: 'Calendar', short: 'Calendar', icon: CalendarDays, group: 'Insights', skeleton: 'calendar' },
  { to: '/achievements', label: 'Achievements', short: 'Awards', icon: Trophy, group: 'Insights', skeleton: 'grid' },

  { to: '/settings', label: 'Settings', short: 'Settings', icon: SettingsIcon, group: 'App', skeleton: 'list' },
];

export const NAV_GROUPS = ['Daily', 'Trackers', 'Insights', 'App'];

/** Bottom-nav primaries (§5.3): Home · Plan · Timer · Analytics · More */
export const BOTTOM_PRIMARY = ['/', '/plan', '/timer', '/analytics'];

/** Everything the "More" bottom sheet shows. */
export const MORE_ITEMS = NAV_ITEMS.filter((i) => !BOTTOM_PRIMARY.includes(i.to));

/** Route → page title used by the navbar and useDocumentMeta. */
export const TITLES = NAV_ITEMS.reduce((acc, i) => {
  acc[i.to] = i.label;
  return acc;
}, {});

export function titleForPath(pathname) {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname === '/welcome') return 'Welcome';
  return 'Not Found';
}
