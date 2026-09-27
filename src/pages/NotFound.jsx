import { Compass, Home, Timer } from 'lucide-react';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import Button from '../components/common/Button.jsx';

export default function NotFound() {
  useDocumentMeta('Page not found', 'This StudyLoop page does not exist.');

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '55dvh', textAlign: 'center' }}>
      <div>
        <div className="empty-icon" style={{ margin: '0 auto var(--sp-4)', width: 72, height: 72 }} aria-hidden="true">
          <Compass size={32} />
        </div>
        <p className="gradient-text" style={{ fontSize: 'var(--fs-48)', fontWeight: 800, lineHeight: 1 }}>
          404
        </p>
        <h1 style={{ margin: 'var(--sp-3) 0 var(--sp-2)' }}>This page took a study break</h1>
        <p className="muted" style={{ maxWidth: '44ch', margin: '0 auto var(--sp-6)' }}>
          The page you are looking for does not exist. Your study data is untouched.
        </p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <Button to="/" variant="primary" icon={Home}>
            Back to Dashboard
          </Button>
          <Button to="/timer" variant="ghost" icon={Timer}>
            Open the timer
          </Button>
        </div>
      </div>
    </div>
  );
}
