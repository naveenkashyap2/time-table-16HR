/**
 * Single registry of route → dynamic import.
 * Shared by the router (React.lazy) and the nav chrome (prefetch-on-intent,
 * §5.4) so hovering a link warms exactly the chunk the route will need.
 */
export const pageLoaders = {
  '/': () => import('../pages/Dashboard.jsx'),
  '/plan': () => import('../pages/TodayPlan.jsx'),
  '/timer': () => import('../pages/Timer.jsx'),
  '/tasks': () => import('../pages/Tasks.jsx'),
  '/dsa': () => import('../pages/DSA.jsx'),
  '/projects': () => import('../pages/Projects.jsx'),
  '/interview': () => import('../pages/Interview.jsx'),
  '/system-design': () => import('../pages/SystemDesign.jsx'),
  '/dotnet': () => import('../pages/DotNet.jsx'),
  '/react-native': () => import('../pages/ReactNative.jsx'),
  '/analytics': () => import('../pages/Analytics.jsx'),
  '/calendar': () => import('../pages/Calendar.jsx'),
  '/achievements': () => import('../pages/Achievements.jsx'),
  '/settings': () => import('../pages/Settings.jsx'),
};

const warmed = new Set();

/** Fire the dynamic import once, ignoring failures (it will retry on nav). */
export function prefetchRoute(path) {
  if (warmed.has(path)) return;
  const loader = pageLoaders[path];
  if (!loader) return;
  warmed.add(path);
  loader().catch(() => warmed.delete(path));
}
