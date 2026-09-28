import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { Analytics } from '@vercel/analytics/react';
import { ChipDefs } from './components/Chips';
import { Entry } from './components/Entry';
import { Header, StepStatus, type Mode } from './components/Header';
import { Practice } from './components/Practice';
import { Review, type ReviewPhase } from './components/Review';
import { prefersReducedMotion } from './lib/motion';

type View = {
  mode: Mode;
  start: 'blank' | 'example';
  fromEntry: boolean;
  key: number;
};

const SEEN = 'felt:entered';

function initialView(): View {
  const hash = typeof location !== 'undefined' ? location.hash : '';
  let seen = false;
  try {
    seen = sessionStorage.getItem(SEEN) === '1';
  } catch {
    // Storage can be unavailable (private mode, embedded views).
  }
  if (hash === '#practice')
    return { mode: 'practice', start: 'blank', fromEntry: false, key: 0 };
  if (hash === '#review' || hash === '#example' || seen)
    return {
      mode: 'review',
      start: hash === '#example' ? 'example' : 'blank',
      fromEntry: false,
      key: 0,
    };
  return { mode: 'entry', start: 'blank', fromEntry: false, key: 0 };
}

const PHASES: Record<ReviewPhase, [string, string]> = {
  hand: ['01', 'The hand'],
  price: ['02', 'The price'],
  reading: ['03', 'The decision'],
  ready: ['03', 'The decision'],
};

// Move between views as one continuous motion where the browser supports it:
// the two hole cards travel from the opening into their seats on the table.
function transition(update: () => void) {
  const doc = document as Document & {
    startViewTransition?: (callback: () => void) => unknown;
  };
  if (!doc.startViewTransition || prefersReducedMotion()) {
    update();
    return;
  }
  doc.startViewTransition(() => flushSync(update));
}

export default function App() {
  const [view, setView] = useState<View>(initialView);
  const [phase, setPhase] = useState<ReviewPhase>('hand');
  const [score, setScore] = useState({ correct: 0, attempts: 0, streak: 0 });

  useEffect(() => {
    const hash =
      view.mode === 'entry'
        ? ''
        : view.mode === 'practice'
          ? '#practice'
          : '#review';
    if (location.hash !== hash)
      history.replaceState(
        null,
        '',
        hash || location.pathname + location.search,
      );
    if (view.mode !== 'entry')
      try {
        sessionStorage.setItem(SEEN, '1');
      } catch {
        // Ignore: the entry simply shows again next time.
      }
  }, [view.mode]);

  const go = useCallback(
    (mode: Mode, start: 'blank' | 'example' = 'blank') => {
      const fromEntry = view.mode === 'entry' && mode === 'review';
      transition(() => {
        setView((current) => ({
          mode,
          start,
          fromEntry,
          key: current.key + 1,
        }));
        if (mode === 'review')
          setPhase(start === 'example' ? 'reading' : 'hand');
      });
      window.scrollTo({ top: 0 });
    },
    [view.mode],
  );

  const onPhase = useCallback((next: ReviewPhase) => setPhase(next), []);
  const onScore = useCallback(
    (next: { correct: number; attempts: number; streak: number }) =>
      setScore(next),
    [],
  );

  const status =
    view.mode === 'review' ? (
      <StepStatus n={PHASES[phase][0]} name={PHASES[phase][1]} />
    ) : view.mode === 'practice' ? (
      <span className="step-status">
        <span className="step-status-n num">
          {score.correct}/{score.attempts}
        </span>
        <span className="step-status-name">
          correct{score.streak > 1 ? ` · ${score.streak} in a row` : ''}
        </span>
      </span>
    ) : null;

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to the table
      </a>
      <ChipDefs />
      <div className="app" data-mode={view.mode}>
        <Header
          mode={view.mode}
          status={status}
          onHome={() => go('entry')}
          onMode={(mode) => go(mode)}
        />
        {view.mode === 'entry' ? (
          <Entry
            onEnter={(start) => go('review', start)}
            onPractice={() => go('practice')}
          />
        ) : view.mode === 'review' ? (
          <main id="main" className="main">
            <Review
              key={view.key}
              start={view.start}
              fromEntry={view.fromEntry}
              onPhase={onPhase}
            />
          </main>
        ) : (
          <main id="main" className="main">
            <Practice key={view.key} onScore={onScore} />
          </main>
        )}
      </div>
      <Analytics />
    </>
  );
}
