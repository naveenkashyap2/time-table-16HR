import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import { AlertTriangle, Home, RotateCw } from 'lucide-react';
import Button from './Button.jsx';

/**
 * Friendly error card — never a white screen (§5.2, §13).
 * Also catches lazy chunk-load failures, where a reload is the real fix.
 */
export default function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  const isChunkError =
    error &&
    /dynamically imported module|Importing a module script failed|Failed to fetch/i.test(
      String(error.message || error),
    );

  const status = isRouteErrorResponse(error) ? error.status : null;
  const detail = isRouteErrorResponse(error)
    ? error.statusText
    : String(error?.message || error || 'Unknown error');

  return (
    <main className="page-wrap" style={{ display: 'grid', placeItems: 'center', minHeight: '70dvh' }}>
      <div className="card card-pad-lg" style={{ maxWidth: 520, textAlign: 'center' }}>
        <div
          className="empty-icon"
          style={{ background: 'var(--danger-soft)', color: 'var(--danger)', margin: '0 auto 16px' }}
          aria-hidden="true"
        >
          <AlertTriangle size={26} />
        </div>
        <h1 style={{ fontSize: 'var(--fs-20)', marginBottom: 8 }}>
          {status ? `Error ${status}` : 'Something went wrong'}
        </h1>
        <p className="small muted" style={{ marginBottom: 20 }}>
          {isChunkError
            ? 'This part of the app could not be downloaded. Your data is safe — reloading usually fixes it.'
            : 'Your study data is stored locally and is safe. Try reloading the page.'}
        </p>
        <details style={{ marginBottom: 20, textAlign: 'left' }}>
          <summary className="small muted" style={{ cursor: 'pointer' }}>
            Technical details
          </summary>
          <pre className="notes-box xsmall" style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>
            {detail}
          </pre>
        </details>
        <div className="row" style={{ justifyContent: 'center' }}>
          <Button variant="primary" icon={RotateCw} onClick={() => window.location.reload()}>
            Reload
          </Button>
          <Button variant="ghost" icon={Home} onClick={() => navigate('/', { replace: true })}>
            Go Home
          </Button>
        </div>
      </div>
    </main>
  );
}
