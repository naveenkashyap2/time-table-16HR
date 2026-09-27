import { Navigate, useLocation } from 'react-router-dom';
import { useSettings } from '../../context/StudyContext.jsx';

/** PRD §5.2 — if not onboarded, everything redirects to /welcome. */
export default function OnboardingGuard({ children }) {
  const settings = useSettings();
  const location = useLocation();

  if (settings.onboarded !== true) {
    return <Navigate to="/welcome" replace state={{ from: location.pathname }} />;
  }
  return children;
}
