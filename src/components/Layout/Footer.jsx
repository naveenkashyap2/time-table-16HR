import { memo } from 'react';
import { Link } from 'react-router-dom';

/** PRD §10.15 — exact content. "Developed by Naveen", no copyright line. */
function Footer() {
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <p className="footer-title">StudyLoop — 16-Hour Study Target Tracker</p>
        <p className="footer-tagline">
          &ldquo;Stay consistent. Keep learning. Keep building.&rdquo;
        </p>
        <nav className="footer-links" aria-label="Footer navigation">
          <Link to="/">Dashboard</Link>
          <Link to="/analytics">Analytics</Link>
          <Link to="/projects">Projects</Link>
          <Link to="/settings">Settings</Link>
        </nav>
        <p className="footer-credit">Developed by Naveen</p>
      </div>
    </footer>
  );
}

export default memo(Footer);
