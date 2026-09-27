/** Shared recharts styling. CSS custom properties work directly in SVG. */
export const SLICE_COLORS = [
  'var(--primary)',
  'var(--secondary)',
  'var(--accent)',
  '#8b5cf6',
  '#f472b6',
  '#fbbf24',
  '#34d399',
  '#60a5fa',
];

export const axisProps = {
  stroke: 'var(--muted)',
  tick: { fill: 'var(--muted)', fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: 'var(--border)' },
};

export const tooltipProps = {
  contentStyle: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    boxShadow: 'var(--shadow-2)',
    color: 'var(--text)',
    fontSize: 13,
  },
  labelStyle: { color: 'var(--text)', fontWeight: 700, marginBottom: 4 },
  itemStyle: { color: 'var(--muted)' },
  cursor: { fill: 'var(--surface-inset)', opacity: 0.6 },
};

export const gridProps = {
  stroke: 'var(--border)',
  strokeDasharray: '3 3',
  vertical: false,
};

export const fmtHours = (v) => `${v}h`;
