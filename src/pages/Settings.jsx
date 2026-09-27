import { useMemo, useRef, useState } from 'react';
import {
  Download, Upload, Trash2, Sun, Moon, Monitor, User, Target, Flame, Palette,
  Bell, CalendarRange, Sparkles, Database, AlertTriangle,
} from 'lucide-react';
import { useStudy, useStudyActions } from '../context/StudyContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { formatMinutes } from '../utils/formatTime.js';
import { storageFootprint } from '../utils/storage.js';
import {
  downloadBackup, validateBackup, MAX_IMPORT_BYTES, BACKUP_FILENAME,
} from '../utils/backup.js';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';

const THEMES = [
  { key: 'light', label: 'Light', icon: Sun },
  { key: 'dark', label: 'Dark', icon: Moon },
  { key: 'system', label: 'System', icon: Monitor },
];

const TONES = [
  { key: 'discipline', label: 'Discipline' },
  { key: 'focus', label: 'Focus' },
  { key: 'growth', label: 'Growth' },
  { key: 'grind', label: 'Grind' },
];

const WEEK_DAYS = [
  { value: 1, label: 'Monday' },
  { value: 0, label: 'Sunday' },
  { value: 6, label: 'Saturday' },
];

export default function Settings() {
  useDocumentMeta(
    'Settings',
    'Configure your daily target, streak threshold, theme, notifications, and export or import your StudyLoop data.',
  );

  const state = useStudy();
  const { settings } = state;
  const { updateSettings, importAll, resetAll } = useStudyActions();
  const { preference, setTheme } = useTheme();
  const toast = useToast();

  const fileRef = useRef(null);
  const [pendingImport, setPendingImport] = useState(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetText, setResetText] = useState('');

  const footprint = useMemo(() => storageFootprint(), [state]);

  const hours = settings.dailyTargetMinutes / 60;

  /* ---------------- export ---------------- */
  const onExport = () => {
    const bytes = downloadBackup(state);
    toast.success('Backup exported', `${BACKUP_FILENAME} — ${(bytes / 1024).toFixed(1)} KB`);
  };

  /* ---------------- import ---------------- */
  const onPickFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;

    if (file.size > MAX_IMPORT_BYTES) {
      toast.error('File too large', 'Backups must be under 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => toast.error('Could not read file', 'Try exporting a fresh backup.');
    reader.onload = () => {
      const result = validateBackup(String(reader.result || ''));
      if (!result.ok) {
        toast.error('Invalid backup file', result.error);
        return;
      }
      setPendingImport(result);
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    importAll(pendingImport.data);
    const s = pendingImport.summary;
    setPendingImport(null);
    toast.success(
      'Backup restored',
      `${s.sessions} sessions across ${s.days} days imported.`,
    );
  };

  /* ---------------- reset ---------------- */
  const confirmReset = () => {
    resetAll();
    setResetOpen(false);
    setResetText('');
    toast.info('All data cleared', 'StudyLoop has been reset to a fresh install.');
  };

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Settings</h1>
          <p className="page-sub">Everything is stored locally on this device.</p>
        </div>
      </header>

      {/* ---------------- Targets ---------------- */}
      <Card title="Study targets" icon={Target}>
        <div className="settings-row">
          <div className="grow">
            <div className="sr-label">Daily target</div>
            <p className="sr-desc">
              Drives every progress number in the app. Changing it re-targets today and all
              future days; your history keeps the target it was set with.
            </p>
          </div>
          <div style={{ minWidth: 260, flex: '1 1 260px' }}>
            <div className="row-between" style={{ marginBottom: 6 }}>
              <span className="xsmall muted">1h</span>
              <strong className="tnum">{formatMinutes(settings.dailyTargetMinutes)}</strong>
              <span className="xsmall muted">20h</span>
            </div>
            <input
              className="range"
              type="range"
              min={1}
              max={20}
              step={1}
              value={hours}
              onChange={(e) => updateSettings({ dailyTargetMinutes: Number(e.target.value) * 60 })}
              aria-label="Daily target in hours"
              aria-valuetext={`${hours} hours`}
            />
          </div>
        </div>

        <div className="settings-row">
          <div className="grow">
            <div className="sr-label">
              <Flame size={14} aria-hidden="true" /> Streak threshold
            </div>
            <p className="sr-desc">
              A day counts towards your streak once you reach this share of the daily target —
              currently {formatMinutes(
                Math.ceil((settings.streakThresholdPercent / 100) * settings.dailyTargetMinutes),
              )}.
            </p>
          </div>
          <div style={{ minWidth: 260, flex: '1 1 260px' }}>
            <div className="row-between" style={{ marginBottom: 6 }}>
              <span className="xsmall muted">10%</span>
              <strong className="tnum">{settings.streakThresholdPercent}%</strong>
              <span className="xsmall muted">100%</span>
            </div>
            <input
              className="range"
              type="range"
              min={10}
              max={100}
              step={5}
              value={settings.streakThresholdPercent}
              onChange={(e) => updateSettings({ streakThresholdPercent: Number(e.target.value) })}
              aria-label="Streak threshold percentage"
              aria-valuetext={`${settings.streakThresholdPercent} percent`}
            />
          </div>
        </div>

        <div className="settings-row">
          <div className="grow">
            <div className="sr-label">Auto-stop at subject target</div>
            <p className="sr-desc">
              Automatically stop and save the session the moment a subject hits its daily target.
            </p>
          </div>
          <input
            type="checkbox"
            className="switch"
            checked={Boolean(settings.autoStopOnTarget)}
            onChange={(e) => updateSettings({ autoStopOnTarget: e.target.checked })}
            aria-label="Auto-stop when a subject target is reached"
          />
        </div>

        <div className="settings-row">
          <div className="grow">
            <div className="sr-label">
              <CalendarRange size={14} aria-hidden="true" /> Week starts on
            </div>
            <p className="sr-desc">Affects weekly analytics, the calendar and the heatmap.</p>
          </div>
          <select
            className="select"
            style={{ maxWidth: 180 }}
            value={settings.weekStartsOn}
            onChange={(e) => updateSettings({ weekStartsOn: Number(e.target.value) })}
            aria-label="First day of the week"
          >
            {WEEK_DAYS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* ---------------- Appearance ---------------- */}
      <Card className="section" title="Appearance" icon={Palette}>
        <div className="settings-row">
          <div className="grow">
            <div className="sr-label">Theme</div>
            <p className="sr-desc">System follows your device&rsquo;s light/dark preference.</p>
          </div>
          <div className="row wrap">
            {THEMES.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`chip chip-btn${preference === t.key ? ' is-active' : ''}`}
                onClick={() => setTheme(t.key)}
                aria-pressed={preference === t.key}
                style={{ minHeight: 40 }}
              >
                <t.icon size={15} aria-hidden="true" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-row">
          <div className="grow">
            <div className="sr-label">
              <User size={14} aria-hidden="true" /> Display name
            </div>
            <p className="sr-desc">Used in the dashboard greeting and your avatar initials.</p>
          </div>
          <input
            className="input"
            style={{ maxWidth: 240 }}
            value={settings.userName}
            onChange={(e) => updateSettings({ userName: e.target.value })}
            maxLength={40}
            aria-label="Display name"
          />
        </div>
      </Card>

      {/* ---------------- Quote ---------------- */}
      <Card className="section" title="Daily quote" icon={Sparkles}>
        <div className="settings-row">
          <div className="grow">
            <div className="sr-label">Show the daily quote</div>
            <p className="sr-desc">
              Fetched once per day from Gemini and cached. Without an API key StudyLoop uses its
              24 built-in offline quotes.
            </p>
          </div>
          <input
            type="checkbox"
            className="switch"
            checked={settings.quote?.enabled !== false}
            onChange={(e) =>
              updateSettings({ quote: { ...settings.quote, enabled: e.target.checked } })
            }
            aria-label="Show the daily quote"
          />
        </div>

        <div className="settings-row">
          <div className="grow">
            <div className="sr-label">Tone</div>
            <p className="sr-desc">Steers what the generated line focuses on.</p>
          </div>
          <select
            className="select"
            style={{ maxWidth: 200 }}
            value={settings.quote?.tone || 'discipline'}
            onChange={(e) => updateSettings({ quote: { ...settings.quote, tone: e.target.value } })}
            aria-label="Quote tone"
          >
            {TONES.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* ---------------- Notifications ---------------- */}
      <Card className="section" title="In-app notifications" icon={Bell}>
        {[
          { key: 'sessionComplete', label: 'Session completed', desc: 'Add a bell entry each time you stop a timer.' },
          { key: 'streakWarning', label: 'Streak warning', desc: 'Warn in the evening when your streak is still at risk.' },
          { key: 'dailySummary', label: 'Daily summary', desc: 'Summarise the day when you open the app the next morning.' },
        ].map((n) => (
          <div className="settings-row" key={n.key}>
            <div className="grow">
              <div className="sr-label">{n.label}</div>
              <p className="sr-desc">{n.desc}</p>
            </div>
            <input
              type="checkbox"
              className="switch"
              checked={Boolean(settings.notifications?.[n.key])}
              onChange={(e) =>
                updateSettings({
                  notifications: { ...settings.notifications, [n.key]: e.target.checked },
                })
              }
              aria-label={n.label}
            />
          </div>
        ))}
      </Card>

      {/* ---------------- Data ---------------- */}
      <Card className="section" title="Your data" icon={Database}>
        <div className="settings-row">
          <div className="grow">
            <div className="sr-label">Export data</div>
            <p className="sr-desc">
              Downloads <code>{BACKUP_FILENAME}</code> — a complete dump of every subject, task,
              session, tracker and achievement. Currently about{' '}
              {(footprint / 1024).toFixed(1)} KB.
            </p>
          </div>
          <Button variant="secondary" icon={Download} onClick={onExport}>
            Export Data
          </Button>
        </div>

        <div className="settings-row">
          <div className="grow">
            <div className="sr-label">Import data</div>
            <p className="sr-desc">
              Validates the file, shows you a summary, then replaces everything on confirmation.
              An invalid file changes nothing.
            </p>
          </div>
          <>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={onPickFile}
              className="sr-only"
              aria-label="Choose a backup file to import"
            />
            <Button variant="secondary" icon={Upload} onClick={() => fileRef.current?.click()}>
              Import Data
            </Button>
          </>
        </div>

        <div className="settings-row">
          <div className="grow">
            <div className="sr-label" style={{ color: 'var(--danger)' }}>
              <AlertTriangle size={14} aria-hidden="true" /> Reset everything
            </div>
            <p className="sr-desc">
              Deletes every session, task, tracker and achievement on this device and returns you
              to onboarding. Export a backup first.
            </p>
          </div>
          <Button variant="danger" icon={Trash2} onClick={() => setResetOpen(true)}>
            Reset Data
          </Button>
        </div>
      </Card>

      <p className="small muted section" style={{ textAlign: 'center' }}>
        Schema version {settings.schemaVersion} · StudyLoop stores everything in this browser only.
      </p>

      {/* ---------------- Import preview ---------------- */}
      <Modal
        open={Boolean(pendingImport)}
        onClose={() => setPendingImport(null)}
        title="Import this backup?"
        description="This replaces all current data on this device."
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingImport(null)}>Cancel</Button>
            <Button variant="primary" onClick={confirmImport} data-autofocus>
              Replace my data
            </Button>
          </>
        }
      >
        {pendingImport ? (
          <ul className="list-reset card-rows">
            {[
              ['Exported', pendingImport.summary.exportedAt
                ? new Date(pendingImport.summary.exportedAt).toLocaleString()
                : 'unknown'],
              ['Schema version', String(pendingImport.summary.schemaVersion)],
              ['Subjects', pendingImport.summary.subjects],
              ['Tasks', pendingImport.summary.tasks],
              ['Sessions', pendingImport.summary.sessions],
              ['Days recorded', pendingImport.summary.days],
              ['Total studied', formatMinutes(pendingImport.summary.totalMinutes)],
              ['DSA problems', pendingImport.summary.dsa],
              ['Projects', pendingImport.summary.projects],
              ['Achievements', pendingImport.summary.achievements],
            ].map(([k, v]) => (
              <li className="mini-row" key={k}>
                <span className="grow">{k}</span>
                <strong className="tnum">{v}</strong>
              </li>
            ))}
          </ul>
        ) : null}
      </Modal>

      {/* ---------------- Reset (double confirm) ---------------- */}
      <Modal
        open={resetOpen}
        onClose={() => {
          setResetOpen(false);
          setResetText('');
        }}
        title="Delete all StudyLoop data?"
        description="This cannot be undone."
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setResetOpen(false);
                setResetText('');
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmReset} disabled={resetText !== 'DELETE'}>
              Delete everything
            </Button>
          </>
        }
      >
        <p className="small">
          Every session, streak, task and tracker entry on this device will be erased and you will
          be returned to the welcome screen.
        </p>
        <div className="field">
          <label className="field-label" htmlFor="reset-confirm">
            Type <strong>DELETE</strong> to confirm
          </label>
          <input
            id="reset-confirm"
            className="input"
            value={resetText}
            onChange={(e) => setResetText(e.target.value)}
            placeholder="DELETE"
            autoComplete="off"
            data-autofocus
          />
        </div>
      </Modal>
    </>
  );
}
