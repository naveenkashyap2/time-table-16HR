import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProgressBar from '../components/common/ProgressBar.jsx';
import CircularProgress from '../components/common/CircularProgress.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Modal from '../components/common/Modal.jsx';
import StatGrid from '../components/Analytics/StatGrid.jsx';

describe('ProgressBar', () => {
  it('exposes correct ARIA values on a 0-100 scale', () => {
    render(<ProgressBar percent={50} label="Daily progress" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '50');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-label', 'Daily progress');
  });

  it('clamps an over-target percentage to 100 (§9.1 display clamp)', () => {
    render(<ProgressBar percent={125} label="Over" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('clamps negative/garbage input to 0', () => {
    render(<ProgressBar percent={NaN} label="Bad" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('can render a visible value', () => {
    render(<ProgressBar percent={42} label="Shown" showValue />);
    expect(screen.getByText('42%')).toBeInTheDocument();
  });
});

describe('CircularProgress', () => {
  it('renders an accessible percentage', () => {
    render(<CircularProgress percent={62} />);
    expect(screen.getByRole('img', { name: /62 percent complete/i })).toBeInTheDocument();
  });

  it('clamps out-of-range input', () => {
    render(<CircularProgress percent={150} />);
    expect(screen.getByRole('img', { name: /100 percent complete/i })).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('renders title and message', () => {
    render(
      <EmptyState
        title="No sessions yet"
        message="Start the timer to log your first session."
      />,
    );
    expect(screen.getByText('No sessions yet')).toBeInTheDocument();
    expect(screen.getByText(/Start the timer/)).toBeInTheDocument();
  });

  it('renders an action button that fires onAction', async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(
      <EmptyState
        title="No sessions yet"
        actionLabel="Start timer"
        onAction={() => { clicked = true; }}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Start timer' }));
    expect(clicked).toBe(true);
  });

  it('omits the action when no handler is supplied', () => {
    render(<EmptyState title="Nothing" actionLabel="Ghost" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('StatGrid', () => {
  it('renders each stat with its label, value and sub-label', () => {
    render(
      <StatGrid
        items={[
          { label: 'Total', value: '16h', sub: 'this week' },
          { label: 'Best day', value: '4h', sub: 'Monday' },
        ]}
      />,
    );
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('16h')).toBeInTheDocument();
    expect(screen.getByText('this week')).toBeInTheDocument();
    expect(screen.getByText('Best day')).toBeInTheDocument();
  });
});

describe('Modal', () => {
  it('is not rendered when closed', () => {
    render(<Modal open={false} onClose={() => {}} title="Hi"><p>Body</p></Modal>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders as a labelled modal dialog', () => {
    render(<Modal open onClose={() => {}} title="Confirm"><p>Body</p></Modal>);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    let open = true;
    render(<Modal open onClose={() => { open = false; }} title="Confirm"><p>Body</p></Modal>);
    await user.keyboard('{Escape}');
    expect(open).toBe(false);
  });
});
