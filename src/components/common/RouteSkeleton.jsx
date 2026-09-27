/**
 * Per-page shimmer skeletons matching the final layout (§5.2).
 * aria-busy so assistive tech knows content is loading.
 */
const Line = ({ w = '100%', h = 12, mb = 8 }) => (
  <div className="skel skel-line" style={{ width: w, height: h, marginBottom: mb }} />
);

const Cards = ({ n = 4 }) => (
  <div className="stat-grid" style={{ marginBottom: 24 }}>
    {Array.from({ length: n }).map((_, i) => (
      <div key={i} className="skel skel-card" />
    ))}
  </div>
);

const Grid = ({ n = 6, h = 190 }) => (
  <div className="subject-grid">
    {Array.from({ length: n }).map((_, i) => (
      <div key={i} className="skel" style={{ height: h, borderRadius: 'var(--r-lg)' }} />
    ))}
  </div>
);

const VARIANTS = {
  dashboard: (
    <>
      <Line w="240px" h={26} mb={6} />
      <Line w="180px" h={12} mb={24} />
      <div className="skel" style={{ height: 110, borderRadius: 'var(--r-lg)', marginBottom: 24 }} />
      <Cards n={5} />
      <div className="skel" style={{ height: 240, borderRadius: 'var(--r-lg)', marginBottom: 24 }} />
      <Grid n={6} />
    </>
  ),
  analytics: (
    <>
      <Line w="200px" h={26} mb={24} />
      <Cards n={4} />
      <div className="skel skel-chart" style={{ marginBottom: 24 }} />
      <div className="two-col">
        <div className="skel skel-chart" />
        <div className="skel skel-chart" />
      </div>
    </>
  ),
  timer: (
    <>
      <Line w="180px" h={26} mb={24} />
      <div className="skel" style={{ height: 380, borderRadius: 'var(--r-lg)', marginBottom: 24 }} />
      <Grid n={3} h={120} />
    </>
  ),
  calendar: (
    <>
      <Line w="200px" h={26} mb={24} />
      <div className="skel" style={{ height: 420, borderRadius: 'var(--r-lg)', marginBottom: 24 }} />
      <div className="skel" style={{ height: 180, borderRadius: 'var(--r-lg)' }} />
    </>
  ),
  table: (
    <>
      <Line w="200px" h={26} mb={24} />
      <Cards n={4} />
      <div className="skel" style={{ height: 420, borderRadius: 'var(--r-lg)' }} />
    </>
  ),
  grid: (
    <>
      <Line w="200px" h={26} mb={24} />
      <Cards n={4} />
      <Grid n={6} />
    </>
  ),
  welcome: (
    <>
      <div className="skel" style={{ height: 120, borderRadius: 'var(--r-lg)', marginBottom: 24 }} />
      <div className="skel" style={{ height: 360, borderRadius: 'var(--r-lg)' }} />
    </>
  ),
  list: (
    <>
      <Line w="200px" h={26} mb={24} />
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="skel" style={{ height: 58, borderRadius: 'var(--r-md)', marginBottom: 10 }} />
      ))}
    </>
  ),
};

export default function RouteSkeleton({ variant = 'grid' }) {
  return (
    <div className="page-wrap" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading page…</span>
      {VARIANTS[variant] || VARIANTS.grid}
    </div>
  );
}
