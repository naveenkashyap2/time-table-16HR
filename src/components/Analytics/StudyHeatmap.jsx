import { memo } from 'react';
import { useHeatmapData } from '../../hooks/useHeatmap.js';
import { HEAT_BANDS } from '../../utils/heatmap.js';
import { formatMinutes } from '../../utils/formatTime.js';
import { formatShortDate, DOW_MIN } from '../../utils/dateUtils.js';

/**
 * GitHub-style heatmap (§9.5). Pure CSS grid — deliberately recharts-free so
 * the Calendar route never pulls the charts chunk.
 */
function StudyHeatmap({ weeks = 26, onSelectDay, selectedKey }) {
  const { columns, monthLabels, totalMinutes, activeDays, weekStartsOn } = useHeatmapData(weeks);

  const dowOrder = Array.from({ length: 7 }, (_, i) => DOW_MIN[(i + weekStartsOn) % 7]);

  return (
    <div>
      <div className="row-between wrap" style={{ marginBottom: 'var(--sp-3)' }}>
        <p className="small muted">
          <strong className="tnum" style={{ color: 'var(--text)' }}>
            {formatMinutes(totalMinutes)}
          </strong>{' '}
          across {activeDays} active day{activeDays === 1 ? '' : 's'} in the last {weeks} weeks
        </p>
        <div className="heat-legend">
          <span>Less</span>
          {HEAT_BANDS.map((b) => (
            <span key={b.level} className="heat-cell" data-level={b.level} title={b.label} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="heatmap-scroll">
        <div style={{ display: 'flex', gap: 6 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateRows: 'repeat(7, 1fr)',
              gap: 3,
              fontSize: 9,
              color: 'var(--muted)',
              paddingTop: 18,
            }}
            aria-hidden="true"
          >
            {dowOrder.map((d, i) => (
              <span key={`${d}-${i}`} style={{ height: 13, lineHeight: '13px' }}>
                {i % 2 === 1 ? d : ''}
              </span>
            ))}
          </div>

          <div>
            <div className="heat-month-row" aria-hidden="true">
              {monthLabels.map((label, i) => (
                <span key={i} style={{ width: 13 }}>
                  {label}
                </span>
              ))}
            </div>

            <div className="heatmap-grid" role="grid" aria-label={`Study heatmap for the last ${weeks} weeks`}>
              {columns.map((col, ci) =>
                col.map((cell) => (
                  <button
                    key={cell.dateKey}
                    type="button"
                    className={`heat-cell${cell.isFuture ? ' is-empty' : ''}`}
                    data-level={cell.level}
                    data-today={cell.isToday}
                    onClick={() => !cell.isFuture && onSelectDay?.(cell.dateKey)}
                    disabled={cell.isFuture}
                    aria-label={`${formatShortDate(cell.dateKey)}: ${formatMinutes(cell.minutes)} studied`}
                    title={`${formatShortDate(cell.dateKey)} — ${formatMinutes(cell.minutes)}`}
                    style={
                      selectedKey === cell.dateKey
                        ? { outline: '2px solid var(--primary)', outlineOffset: 1 }
                        : undefined
                    }
                    data-col={ci}
                  />
                )),
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(StudyHeatmap);
