import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import { SLICE_COLORS, axisProps, tooltipProps, gridProps, fmtHours } from './chartTheme.js';
import { heatLevel } from '../../utils/heatmap.js';
import { formatMinutes } from '../../utils/formatTime.js';
import Card from '../common/Card.jsx';

export default function MonthlyChart({ month }) {
  const trend = month.days.map((d) => ({
    name: d.label,
    hours: d.hours,
    target: Number((d.target / 60).toFixed(1)),
  }));

  const pieData = month.distribution.map((s) => ({ name: s.name, value: s.hours }));

  return (
    <>
      <Card title={`${month.monthLabel} — daily trend`}>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="slMonthArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" {...axisProps} interval={2} />
              <YAxis {...axisProps} tickFormatter={fmtHours} />
              <Tooltip {...tooltipProps} formatter={(v) => `${v}h`} labelFormatter={(l) => `Day ${l}`} />
              <Area
                type="monotone"
                dataKey="hours"
                name="Studied"
                stroke="var(--primary)"
                strokeWidth={2.5}
                fill="url(#slMonthArea)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="two-col section">
        <Card title="Completion by day">
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="name" {...axisProps} interval={2} />
                <YAxis {...axisProps} tickFormatter={fmtHours} />
                <Tooltip {...tooltipProps} formatter={(v) => `${v}h`} labelFormatter={(l) => `Day ${l}`} />
                <Bar dataKey="hours" name="Studied" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Subject donut">
          {pieData.length === 0 ? (
            <p className="small muted" style={{ padding: 'var(--sp-8) 0', textAlign: 'center' }}>
              No sessions this month yet.
            </p>
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="55%"
                    outerRadius="82%"
                    paddingAngle={2}
                    stroke="var(--surface)"
                    strokeWidth={2}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={entry.name} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipProps} formatter={(v) => `${v}h`} />
                  <Legend wrapperStyle={{ fontSize: 11, color: 'var(--muted)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <Card className="section" title="Consistency strip">
        <p className="small muted" style={{ marginBottom: 'var(--sp-3)' }}>
          Every day in {month.monthLabel}, shaded by hours studied.
        </p>
        <div className="row wrap" style={{ gap: 4 }}>
          {month.days.map((d) => (
            <span
              key={d.dateKey}
              className="heat-cell"
              data-level={heatLevel(d.minutes)}
              data-today={d.isToday}
              title={`${d.dateKey}: ${formatMinutes(d.minutes)}`}
              style={{ width: 22, height: 22, borderRadius: 6, display: 'grid', placeItems: 'center' }}
            >
              <span className="sr-only">
                {d.dateKey}: {formatMinutes(d.minutes)}
              </span>
            </span>
          ))}
        </div>
      </Card>
    </>
  );
}
