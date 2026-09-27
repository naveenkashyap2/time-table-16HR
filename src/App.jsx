import { RouterProvider } from 'react-router-dom';
import { router } from './router/index.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { StudyProvider } from './context/StudyContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { TimerProvider } from './context/TimerContext.jsx';
import ToastRegion from './components/common/Toast.jsx';
import Confetti from './components/common/Confetti.jsx';

/**
 * Provider order matters:
 *   Toast  → needed by Study (storage errors, achievement toasts)
 *   Study  → owns settings, which Theme reads
 *   Theme  → applies data-theme
 *   Timer  → writes sessions through Study actions
 */
export default function App() {
  return (
    <ToastProvider>
      <StudyProvider>
        <ThemeProvider>
          <TimerProvider>
            <RouterProvider router={router} />
            <ToastRegion />
            <Confetti />
          </TimerProvider>
        </ThemeProvider>
      </StudyProvider>
    </ToastProvider>
  );
}
