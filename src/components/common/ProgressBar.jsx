import { memo } from 'react';

/**
 * Accessible progress bar. `percent` is the CLAMPED display value (§9.1);
 * pass `label` so screen readers get a meaningful announcement.
 */
function ProgressBar({
  percent = 0,
  size = 'md',
  tone = 'gradient',
  label,
  showValue = false,
  className = '',
}) {
  const clamped = Math.max(0, Math.min(100, Number(percent) || 0));
  const toneClass =
    tone === 'solid' ? 'pf-solid' : tone === 'success' ? 'pf-success' : tone === 'warm' ? 'pf-warm' : '';

  return (
    <div className={className}>
      <div
        className={['progress-track', size === 'sm' ? 'pt-sm' : size === 'lg' ? 'pt-lg' : '']
          .filter(Boolean)
          .join(' ')}
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className={`progress-fill ${toneClass}`} style={{ width: `${clamped}%` }} />
      </div>
      {showValue ? (
        <div className="xsmall muted tnum" style={{ marginTop: 4 }}>
          {Math.round(clamped)}%
        </div>
      ) : null}
    </div>
  );
}

export default memo(ProgressBar);
