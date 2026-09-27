import { memo } from 'react';

/** Compact label/value grid used across the analytics tabs. */
function StatGrid({ items, columns = 4 }) {
  return (
    <div className={`stat-grid stat-grid-${columns}`}>
      {items.map((it) => (
        <article className="stat-card" data-tone={it.tone || 'primary'} key={it.label}>
          <div className="row-between">
            <span className="stat-label">{it.label}</span>
            {it.icon ? (
              <span className="stat-icon" aria-hidden="true">
                <it.icon size={19} />
              </span>
            ) : null}
          </div>
          <div className="stat-value">{it.value}</div>
          {it.sub ? <div className="stat-sub">{it.sub}</div> : null}
        </article>
      ))}
    </div>
  );
}

export default memo(StatGrid);
