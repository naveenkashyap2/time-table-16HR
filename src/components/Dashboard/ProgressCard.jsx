import { memo } from 'react';
import { useCountUp } from '../../hooks/useCountUp.js';

/**
 * Stat tile with an animated count-up numeral (§10.2.3).
 * `value` renders as-is; pass `countTo` + `format` to animate a number.
 */
function ProgressCard({
  label,
  value,
  countTo,
  format = (n) => Math.round(n),
  sub,
  icon: Icon,
  tone = 'primary',
}) {
  const animated = useCountUp(Number.isFinite(countTo) ? countTo : 0);
  const display = Number.isFinite(countTo) ? format(animated) : value;

  return (
    <article className="stat-card" data-tone={tone}>
      <div className="row-between">
        <span className="stat-label">{label}</span>
        {Icon ? (
          <span className="stat-icon" aria-hidden="true">
            <Icon size={19} />
          </span>
        ) : null}
      </div>
      <div className="stat-value">{display}</div>
      {sub ? <div className="stat-sub">{sub}</div> : null}
    </article>
  );
}

export default memo(ProgressCard);
