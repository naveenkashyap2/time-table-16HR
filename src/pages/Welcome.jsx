import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Clock, Flame, Target } from 'lucide-react';
import { useStudy, useStudyActions } from '../context/StudyContext.jsx';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { DEFAULT_SUBJECTS, TOTAL_SEED_MINUTES } from '../data/defaultSubjects.js';
import { getIcon } from '../data/icons.js';
import { formatMinutes } from '../utils/formatTime.js';
import Button from '../components/common/Button.jsx';

/** PRD §10.1 — first-time setup, shown once. */
export default function Welcome() {
  useDocumentMeta(
    'Welcome',
    'Set up StudyLoop and start executing your 16-hour daily study plan.',
  );

  const navigate = useNavigate();
  const { settings } = useStudy();
  const { seedDefaults } = useStudyActions();
  const [name, setName] = useState(settings.userName || 'Naveen');

  const rows = useMemo(
    () =>
      DEFAULT_SUBJECTS.map((s) => ({
        ...s,
        Icon: getIcon(s.iconKey),
      })),
    [],
  );

  const begin = () => {
    seedDefaults({ userName: name.trim() || 'Naveen', onboarded: true });
    navigate('/', { replace: true });
  };

  return (
    <main className="page-wrap" style={{ maxWidth: 900, paddingTop: 'var(--sp-12)' }}>
      <section style={{ textAlign: 'center', marginBottom: 'var(--sp-8)' }}>
        <span
          className="brand-mark"
          style={{ width: 64, height: 64, margin: '0 auto var(--sp-4)', borderRadius: 'var(--r-xl)' }}
          aria-hidden="true"
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeDasharray="38 13" transform="rotate(-90 12 12)" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </svg>
        </span>
        <h1 style={{ fontSize: 'var(--fs-hero)', marginBottom: 'var(--sp-2)' }}>
          Welcome to <span className="gradient-text">StudyLoop</span>
        </h1>
        <p className="muted" style={{ fontSize: 'var(--fs-18)', fontWeight: 600 }}>
          16 Hours. Every Day. Keep Building.
        </p>
      </section>

      <div className="stat-grid" style={{ marginBottom: 'var(--sp-8)' }}>
        <article className="stat-card">
          <span className="stat-icon" aria-hidden="true"><Clock size={19} /></span>
          <div className="stat-value">16h</div>
          <div className="stat-sub">Daily target, fully customisable later</div>
        </article>
        <article className="stat-card" data-tone="secondary">
          <span className="stat-icon" aria-hidden="true"><Target size={19} /></span>
          <div className="stat-value">{DEFAULT_SUBJECTS.length}</div>
          <div className="stat-sub">Subjects with their own time blocks</div>
        </article>
        <article className="stat-card" data-tone="accent">
          <span className="stat-icon" aria-hidden="true"><Flame size={19} /></span>
          <div className="stat-value">70%</div>
          <div className="stat-sub">Of target keeps your streak alive</div>
        </article>
      </div>

      <section className="card card-pad-lg" aria-labelledby="plan-heading">
        <h2 id="plan-heading" style={{ marginBottom: 'var(--sp-4)' }}>
          Your default 16-hour plan
        </h2>

        <ul className="list-reset card-rows">
          {rows.map(({ name: subjectName, targetMinutes, Icon, colorKey, subBlocks }) => (
            <li key={subjectName} className="mini-row">
              <span className={`subject-icon tone-${colorKey}`} style={{ width: 34, height: 34, flexBasis: 34 }} aria-hidden="true">
                <Icon size={17} />
              </span>
              <div className="grow" style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 650 }}>{subjectName}</div>
                {subBlocks?.length ? (
                  <div className="xsmall muted truncate">
                    {subBlocks.map((b) => b.name).join(' · ')}
                  </div>
                ) : null}
              </div>
              <span className="chip is-active tnum">{formatMinutes(targetMinutes)}</span>
            </li>
          ))}
        </ul>

        <hr className="divider" />

        <div className="row-between">
          <strong>Total</strong>
          <strong className="tnum gradient-text" style={{ fontSize: 'var(--fs-20)' }}>
            {formatMinutes(TOTAL_SEED_MINUTES)}
          </strong>
        </div>

        <hr className="divider" />

        <div className="field" style={{ maxWidth: 360 }}>
          <label className="field-label" htmlFor="welcome-name">
            What should we call you?
          </label>
          <input
            id="welcome-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && begin()}
            maxLength={40}
            placeholder="Naveen"
          />
          <span className="field-hint">Optional — you can change this any time in Settings.</span>
        </div>

        <div style={{ marginTop: 'var(--sp-6)' }}>
          <Button variant="primary" size="lg" icon={Rocket} onClick={begin} block>
            Start My 16-Hour Journey
          </Button>
        </div>
      </section>

      <p className="footer-credit" style={{ textAlign: 'center', marginTop: 'var(--sp-8)' }}>
        Developed by Naveen
      </p>
    </main>
  );
}
