import type { ReactNode } from 'react';
import { Brand } from './Brand';

export type Mode = 'entry' | 'review' | 'practice';

export function Header({
  mode,
  status,
  onHome,
  onMode,
}: {
  mode: Mode;
  status?: ReactNode;
  onHome: () => void;
  onMode: (mode: 'review' | 'practice') => void;
}) {
  return (
    <header className="header" data-mode={mode}>
      <Brand onClick={onHome} label="FELT, back to the start" />
      <div className="header-status" aria-live="polite">
        {status}
      </div>
      <nav className="modes" aria-label="Mode">
        {(['review', 'practice'] as const).map((value) => (
          <button
            key={value}
            type="button"
            className="mode"
            aria-pressed={mode === value}
            onClick={() => onMode(value)}
          >
            {value === 'review' ? 'Review' : 'Practice'}
          </button>
        ))}
      </nav>
    </header>
  );
}

export function StepStatus({ n, name }: { n: string; name: string }) {
  return (
    <span className="step-status" key={n}>
      <span className="step-status-n num">{n}</span>
      <span className="step-status-name">{name}</span>
    </span>
  );
}
