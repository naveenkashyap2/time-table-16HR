import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { SLICE_COLORS, axisProps, tooltipProps, gridProps, fmtHours } from './chartTheme.js';
import { toHours } from '../../utils/formatTime.js';
import Card from '../common/Card.jsx';

/**
 * Weekly charts. This module is the ONLY place (with MonthlyChart) that
 * imports recharts, and it is reached exclusively through a dynamic import
 * from the Analytics route (§4.1).
 */
export default function WeeklyChart({ week }) {
  const barData = week.days.map((d) => ({
    name: d.shortLabel,
    hours: d.hours,
    target: toHours(d.target),
    remaining: Math.max(0, toHours(Math.max(0, d.target - d.minutes))),
    full: d.label,
  }));

  const pieData = week.distribution.map((s) => ({ name: s.name, value: s.hours }));

  return (
    <>
      <Card title="Daily hours this week">
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={fmtHours} />
              <Tooltip {...tooltipProps} formatter={(v, n) => [`${v}h`, n === 'hours' ? 'Studied' : n]} />
              <Bar dataKey="hours" name="Studied" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="two-col section">
        <Card title="Completed vs remaining">
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="name" {...axisProps} />
                <YAxis {...axisProps} tickFormatter={fmtHours} />
                <Tooltip {...tooltipProps} formatter={(v) => `${v}h`} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }} />
                <Bar dataKey="hours" stackId="a" name="Completed" fill="var(--primary)" radius={[0, 0, 0, 0]} maxBarSize={44} />
                <Bar dataKey="remaining" stackId="a" name="Remaining" fill="var(--surface-inset)" radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Subject distribution">
          {pieData.length === 0 ? (
            <p className="small muted" style={{ padding: 'var(--sp-8) 0', textAlign: 'center' }}>
              No sessions this week yet — start a timer to populate this chart.
            </p>
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="52%"
                    outerRadius="80%"
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

      <Card className="section" title="Daily trend">
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={barData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={fmtHours} />
              <Tooltip {...tooltipProps} formatter={(v) => `${v}h`} />
              <Line
                type="monotone"
                dataKey="hours"
                name="Studied"
                stroke="var(--secondary)"
                strokeWidth={3}
                dot={{ r: 4, fill: 'var(--secondary)' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="target"
                name="Target"
                stroke="var(--muted)"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </>
  );
}
