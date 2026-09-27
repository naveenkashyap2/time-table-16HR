import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '../components/Layout/AppLayout.jsx';
import RouteErrorBoundary from '../components/common/RouteErrorBoundary.jsx';
import RouteSkeleton from '../components/common/RouteSkeleton.jsx';
import OnboardingGuard from '../components/Layout/OnboardingGuard.jsx';
import NotFound from '../pages/NotFound.jsx';
import { pageLoaders } from './pageLoaders.js';

/* Every page is its own chunk (§4.1). Welcome + NotFound stay eager: they are
   tiny and Welcome is the very first paint for a new user. */
const Welcome = lazy(() => import('../pages/Welcome.jsx'));

const Dashboard = lazy(pageLoaders['/']);
const TodayPlan = lazy(pageLoaders['/plan']);
const Timer = lazy(pageLoaders['/timer']);
const Tasks = lazy(pageLoaders['/tasks']);
const DSA = lazy(pageLoaders['/dsa']);
const Projects = lazy(pageLoaders['/projects']);
const Interview = lazy(pageLoaders['/interview']);
const SystemDesign = lazy(pageLoaders['/system-design']);
const DotNet = lazy(pageLoaders['/dotnet']);
const ReactNative = lazy(pageLoaders['/react-native']);
const Analytics = lazy(pageLoaders['/analytics']);
const Calendar = lazy(pageLoaders['/calendar']);
const Achievements = lazy(pageLoaders['/achievements']);
const Settings = lazy(pageLoaders['/settings']);

const suspense = (el, variant) => (
  <Suspense fallback={<RouteSkeleton variant={variant} />}>{el}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/welcome',
    element: suspense(<Welcome />, 'welcome'),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/',
    element: (
      <OnboardingGuard>
        <AppLayout />
      </OnboardingGuard>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: suspense(<Dashboard />, 'dashboard') },
      { path: 'plan', element: suspense(<TodayPlan />, 'list') },
      { path: 'timer', element: suspense(<Timer />, 'timer') },
      { path: 'tasks', element: suspense(<Tasks />, 'list') },
      { path: 'dsa', element: suspense(<DSA />, 'table') },
      { path: 'projects', element: suspense(<Projects />, 'grid') },
      { path: 'interview', element: suspense(<Interview />, 'grid') },
      { path: 'system-design', element: suspense(<SystemDesign />, 'list') },
      { path: 'dotnet', element: suspense(<DotNet />, 'list') },
      { path: 'react-native', element: suspense(<ReactNative />, 'list') },
      { path: 'analytics', element: suspense(<Analytics />, 'analytics') },
      { path: 'calendar', element: suspense(<Calendar />, 'calendar') },
      { path: 'achievements', element: suspense(<Achievements />, 'grid') },
      { path: 'settings', element: suspense(<Settings />, 'list') },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
