import { useId, useState, type ReactNode } from 'react';
import { type Card, cardKey, cardName, cardShort, suits } from '../cards';
import type { DecisionAction } from '../poker/decision';
import type { EquityResult } from '../poker/equity';
import type { financialMetrics } from '../poker/metrics';
import type { raiseMetrics } from '../poker/decision';
import type { OpponentRange } from '../poker/ranges';
import type { OutsState } from '../poker/useOuts';
import { pct, points, signed } from '../lib/format';
import { useCountUp } from '../lib/motion';
import { PlayingCard } from './PlayingCard';
import { RangeGrid, STYLE_SHORT, POSITION_NAMES } from './VillainSeat';

export type CallMath = ReturnType<typeof financialMetrics>;
export type RaiseMath = ReturnType<typeof raiseMetrics>;

export const fmt = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

/* ---------- Small pieces ---------- */

export function Counted({
  value,
  format,
}: {
  value: number;
  format: (value: number) => string;
}) {
  const shown = useCountUp(value);
  return <>{format(shown)}</>;
}

/** A number with a short, tap-to-open explanation of where it comes from. */
export function Stat({
  label,
  value,
  unit,
  explain,
  emphasis = false,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  explain: ReactNode;
  emphasis?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="stat" data-emphasis={emphasis || undefined}>
      <div className="stat-head">
        <span className="kicker">{label}</span>
        <button
          type="button"
          className="info"
          aria-expanded={open}
          aria-controls={id}
          aria-label={`About ${label.toLowerCase()}`}
          onClick={() => setOpen((value) => !value)}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="8" cy="8" r="7.25" />
            <path d="M8 7.2v4.3M8 4.6v.1" />
          </svg>
        </button>
      </div>
      <p className="stat-value num">
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </p>
      <p id={id} className="stat-explain" hidden={!open}>
        {explain}
      </p>
    </div>
  );
}

/* ---------- The decision ---------- */

export type Verdict = {
  action: DecisionAction | 'check';
  title: string;
  ev: number;
  why: string;
};

export function describeDecision({
  best,
  pot,
  call,
  equity,
  callMath,
  raiseMath,
  raiseTo,
  foldEquity,
}: {
  best: DecisionAction;
  pot: number;
  call: number;
  equity: number;
  callMath: CallMath;
  raiseMath: RaiseMath | null;
  raiseTo: number;
  foldEquity: number;
}): Verdict {
  const price = pct(callMath.potOdds);
  if (call === 0)
    return {
      action: 'check',
      title: 'Check',
      ev: callMath.ev,
      why: `There is no bet to call. Checking costs nothing and keeps your ${pct(equity)} equity in the ${fmt(pot)} BB pot.`,
    };
  if (best === 'raise' && raiseMath)
    return {
      action: 'raise',
      title: `Raise to ${fmt(raiseTo)}`,
      ev: raiseMath.ev,
      why: `If villain folds ${pct(foldEquity, 0)} of the time, raising to ${fmt(raiseTo)} earns ${signed(raiseMath.ev)} BB, more than calling (${signed(callMath.ev)}) or folding (0).`,
    };
  if (best === 'call') {
    const raiseNote =
      raiseMath && raiseMath.ev < callMath.ev
        ? ` The modeled raise earns less (${signed(raiseMath.ev)} BB).`
        : '';
    return {
      action: 'call',
      title: 'Call',
      ev: callMath.ev,
      why: `Your ${pct(equity)} equity is above the ${price} you need to break even, so calling earns ${signed(callMath.ev)} BB more than folding on average.${raiseNote}`,
    };
  }
  const raiseNote =
    raiseMath && raiseMath.ev <= 0
      ? ` The raise would need villain to fold ${pct(raiseMath.breakEvenFoldEquity)} of the time; you assumed ${pct(foldEquity)}.`
      : '';
  return {
    action: 'fold',
    title: 'Fold',
    ev: 0,
    why:
      callMath.verdict === 'neutral'
        ? `Your equity exactly matches the ${price} price, so calling and folding both break even.${raiseNote}`
        : `Your ${pct(equity)} equity is short of the ${price} you need, so calling loses ${Math.abs(callMath.ev).toFixed(2)} BB on average. Folding keeps you at zero.${raiseNote}`,
  };
}

export function DecisionHead({
  verdict,
  equity,
  result,
  callMath,
  call,
  pot,
  context,
}: {
  verdict: Verdict;
  equity: number;
  result: EquityResult;
  callMath: CallMath;
  call: number;
  pot: number;
  context: ReactNode;
}) {
  const margin = equity - callMath.potOdds;
  return (
    <section className="decision" aria-labelledby="decision-heading">
      <div className="decision-top">
        <h2 id="decision-heading" className="kicker">
          The decision
        </h2>
        <p className="decision-context">{context}</p>
      </div>
      <p className="decision-action" data-action={verdict.action}>
        <span className="decision-mark" aria-hidden="true" />
        {verdict.title}
      </p>
      <p className="decision-ev">
        <span className="num decision-ev-value">
          <Counted value={verdict.ev} format={(v) => `${signed(v)} BB`} />
        </span>
        <span className="decision-ev-label">
          {verdict.action === 'fold'
            ? 'folding is the zero baseline'
            : 'expected, compared with folding'}
        </span>
      </p>

      <div className="stats">
        <Stat
          label="Equity"
          emphasis
          value={<Counted value={equity * 100} format={(v) => v.toFixed(1)} />}
          unit="%"
          explain={
            <>
              Your estimated share of the pot against villain’s range, averaged
              over every way the rest of the board can fall.{' '}
              {result.method === 'exact'
                ? `Exact: all ${result.trials.toLocaleString()} legal outcomes counted.`
                : `Estimated from ${result.trials.toLocaleString()} seeded samples (±${(
                    (result.marginOfError ?? 0) * 100
                  ).toFixed(1)} pts).`}
            </>
          }
        />
        <Stat
          label="Pot odds"
          value={
            <Counted
              value={callMath.potOdds * 100}
              format={(v) => v.toFixed(1)}
            />
          }
          unit="%"
          explain={
            call === 0
              ? 'There is no bet to call, so any equity is enough.'
              : `${fmt(call)} to call ÷ ${fmt(pot + call)} in the final pot. You need at least this much equity for the call to break even.`
          }
        />
        <Stat
          label="Margin"
          value={
            <Counted value={margin * 100} format={(v) => points(v / 100)} />
          }
          unit="pts"
          explain="Equity minus the break-even price. Above zero, calling earns more than folding; below zero, it costs."
        />
      </div>

      <p className="why">
        <span className="kicker">Why</span>
        {verdict.why}
      </p>
    </section>
  );
}

/* ---------- The action ---------- */

export function StreetRail({
  hole,
  board,
}: {
  hole: (Card | null)[];
  board: (Card | null)[];
}) {
  const count = board.filter(Boolean).length;
  const streets: { name: string; cards: (Card | null)[]; on: boolean }[] = [
    { name: 'Preflop', cards: hole, on: true },
    { name: 'Flop', cards: board.slice(0, 3), on: count >= 3 },
    { name: 'Turn', cards: board.slice(3, 4), on: count >= 4 },
    { name: 'River', cards: board.slice(4, 5), on: count >= 5 },
  ];
  const current = count >= 5 ? 3 : count >= 4 ? 2 : count >= 3 ? 1 : 0;
  return (
    <ol className="rail" aria-label="Streets">
      {streets.map((street, index) => (
        <li
          key={street.name}
          className="rail-step"
          data-on={street.on || undefined}
          data-current={index === current || undefined}
          aria-current={index === current ? 'step' : undefined}
        >
          <span className="rail-name">{street.name}</span>
          <span className="rail-cards">
            {street.on ? (
              street.cards.map((card, i) =>
                card ? (
                  <span key={cardKey(card)} className="rail-card">
                    <PlayingCard card={card} />
                  </span>
                ) : (
                  <span key={i} className="rail-card rail-card-empty" />
                ),
              )
            ) : (
              <span className="rail-dash" aria-hidden="true" />
            )}
          </span>
          <span className="sr-only">
            {street.on
              ? street.cards
                  .filter(Boolean)
                  .map((c) => cardName(c!))
                  .join(', ')
              : 'not dealt'}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Branch({
  label,
  value,
  best,
  pending = false,
  note,
  children,
}: {
  label: ReactNode;
  value: number | null;
  best: boolean;
  pending?: boolean;
  note?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <li className="branch" data-best={best || undefined}>
      <div className="branch-row">
        <span className="branch-label">{label}</span>
        <span className="branch-fill" aria-hidden="true" />
        <span className="branch-value num">
          {pending ? (
            <span className="pending">calculating</span>
          ) : value === null ? (
            <span className="branch-na">{note ?? 'not modeled'}</span>
          ) : (
            <>
              {signed(value)} <span className="branch-unit">BB</span>
            </>
          )}
        </span>
        <span className="branch-best">
          {best && (
            <>
              <span className="branch-best-mark" aria-hidden="true" />
              Best
            </>
          )}
        </span>
      </div>
      {children}
    </li>
  );
}

export function ActionTree({
  pot,
  call,
  street,
  best,
  callMath,
  raiseMath,
  raiseReady,
  raiseTo,
  foldEquity,
  raisePending,
  raiseEquity,
  raiseMessage,
  children,
}: {
  pot: number;
  call: number;
  street: string;
  best: DecisionAction | 'check';
  callMath: CallMath;
  raiseMath: RaiseMath | null;
  raiseReady: boolean;
  raiseTo: number;
  foldEquity: number;
  raisePending: boolean;
  raiseEquity: number | null;
  raiseMessage?: string;
  children?: ReactNode;
}) {
  const before = pot - call;
  return (
    <div className="action">
      <p className="action-lead">
        {call > 0 ? (
          before >= 0 ? (
            <>
              {street}: villain bets{' '}
              <strong className="num">{fmt(call)}</strong> into{' '}
              <strong className="num">{fmt(before)}</strong>. Your move.
            </>
          ) : (
            <>
              {street}: villain bets{' '}
              <strong className="num">{fmt(call)}</strong>. The pot you entered
              is smaller than the bet; pot size should include it.
            </>
          )
        ) : (
          <>
            {street}: no bet to you in a{' '}
            <strong className="num">{fmt(pot)}</strong> BB pot.
          </>
        )}
      </p>
      <ul className="branches">
        {call > 0 && <Branch label="Fold" value={0} best={best === 'fold'} />}
        <Branch
          label={
            call > 0 ? (
              <>
                Call <span className="num">{fmt(call)}</span>
              </>
            ) : (
              'Check'
            )
          }
          value={callMath.ev}
          best={best === 'call' || best === 'check'}
        />
        {call > 0 && (
          <Branch
            label={
              raiseReady ? (
                <>
                  Raise to <span className="num">{fmt(raiseTo)}</span>
                </>
              ) : (
                'Raise'
              )
            }
            value={raiseMath?.ev ?? null}
            pending={raisePending}
            best={best === 'raise'}
            note={raiseMessage ? 'set a size below' : undefined}
          >
            {raiseMath && raiseReady && (
              <ul className="sub-branches">
                <li>
                  <span className="sub-arrow" aria-hidden="true" />
                  Villain folds{' '}
                  <strong className="num">{pct(foldEquity, 0)}</strong>: you
                  take the <strong className="num">{fmt(pot)}</strong> BB pot.
                </li>
                <li>
                  <span className="sub-arrow" aria-hidden="true" />
                  Villain calls{' '}
                  <strong className="num">{pct(1 - foldEquity, 0)}</strong>
                  {raiseEquity !== null && foldEquity < 1 ? (
                    <>
                      : <strong className="num">{pct(raiseEquity)}</strong>{' '}
                      equity against the hands that continue, in a{' '}
                      <strong className="num">
                        {fmt(raiseMath.finalPotIfCalled)}
                      </strong>{' '}
                      BB pot, worth{' '}
                      <strong className="num">
                        {signed(raiseMath.calledBranchEv)}
                      </strong>{' '}
                      BB.
                    </>
                  ) : (
                    '.'
                  )}
                </li>
              </ul>
            )}
          </Branch>
        )}
      </ul>
      {children}
    </div>
  );
}

/* ---------- The next card ---------- */

const bySuitThenRank = (a: Card, b: Card) =>
  suits.indexOf(a.suit) - suits.indexOf(b.suit) ||
  ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'].indexOf(
    a.rank,
  ) -
    ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'].indexOf(
      b.rank,
    );

export function OutsPanel({
  state,
  boardCount,
}: {
  state: OutsState;
  boardCount: number;
}) {
  const [open, setOpen] = useState(false);
  const panel = useId();

  if (boardCount === 0 || boardCount === 5)
    return (
      <p className="muted-line">
        {boardCount === 0
          ? 'Outs are counted on the flop and turn, while cards are still to come.'
          : 'The river is dealt: no cards left to come, so no outs to count.'}
      </p>
    );
  if (state.status !== 'ready')
    return (
      <p className="muted-line">
        {state.status === 'error' ? (
          state.message
        ) : (
          <span className="pending">Dealing every unseen card</span>
        )}
      </p>
    );

  const outs = state.result;
  const counted = [...outs.counted].sort((a, b) =>
    bySuitThenRank(a.card, b.card),
  );
  const rest = outs.outcomes
    .filter((o) => !outs.counted.includes(o))
    .sort((a, b) => bySuitThenRank(a.card, b.card));
  const street = outs.nextStreet;
  const title = outs.leading ? 'Danger cards' : 'Outs';
  const forwardLabel = outs.leading ? 'Put you behind' : 'Put you ahead';
  const backLabel = outs.leading ? 'Keep you ahead' : 'Leave you behind';

  return (
    <div className="outs" data-open={open || undefined}>
      <button
        type="button"
        className="outs-summary"
        aria-expanded={open}
        aria-controls={panel}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="outs-count num">{outs.counted.length}</span>
        <span className="outs-copy">
          <span className="outs-title">
            {title}
            <span className="outs-prob num">
              ≈ {pct(outs.countedProbability)} on the {street}
            </span>
          </span>
          <span className="outs-sub">
            {outs.leading
              ? `Your hand is ahead of ${pct(outs.showdownNow, 0)} of the range now. ${
                  outs.counted.length
                    ? `These ${street} cards drop you below half.`
                    : `No ${street} card drops you below half.`
                }`
              : `Your hand beats ${pct(outs.showdownNow, 0)} of the range now. ${
                  outs.counted.length
                    ? `These ${street} cards lift you above half.`
                    : `No single ${street} card lifts you above half.`
                }`}
          </span>
        </span>
        <span className="outs-toggle">
          {open ? 'Hide cards' : 'Show cards'}
        </span>
      </button>

      <div id={panel} className="outs-cards" hidden={!open}>
        {open && (
          <>
            <p className="kicker">
              {forwardLabel} · {counted.length}
            </p>
            <div className="outs-row outs-row-forward">
              {counted.map((o, i) => (
                <span
                  key={cardKey(o.card)}
                  className="outs-card"
                  style={{ animationDelay: `${i * 28}ms` }}
                  title={`${cardShort(o.card)} → ${pct(o.equity)} equity`}
                >
                  <span className="sr-only">
                    {cardName(o.card)}: {pct(o.equity)} equity.
                  </span>
                  <PlayingCard card={o.card} />
                  <span className="outs-eq num" aria-hidden="true">
                    {Math.round(o.equity * 100)}
                  </span>
                </span>
              ))}
              {!counted.length && <span className="muted-line">None.</span>}
            </div>
            <p className="kicker">
              {backLabel} · {rest.length}
            </p>
            <div className="outs-row outs-row-back">
              {rest.map((o) => (
                <span
                  key={cardKey(o.card)}
                  className="outs-card outs-card-back"
                  title={`${cardShort(o.card)} → ${pct(o.equity)} equity`}
                >
                  <span className="sr-only">
                    {cardName(o.card)}: {pct(o.equity)} equity.
                  </span>
                  <PlayingCard card={o.card} />
                </span>
              ))}
            </div>
            <p className="outs-note">
              Each card is dealt and the hand re-run against villain’s full
              range. Small numbers show your equity after that card. Ahead means
              at least half the pot.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Assumptions ---------- */

export function Assumptions({
  range,
  result,
}: {
  range: OpponentRange;
  result: EquityResult | null;
}) {
  return (
    <div className="assumptions">
      <section className="assume-range" aria-label="Opponent range">
        <RangeGrid range={range} />
        <div>
          <p className="assume-title">
            Villain plays{' '}
            <strong className="num">{range.percentage.toFixed(1)}%</strong>
          </p>
          <p className="assume-sub">
            {POSITION_NAMES[range.position]} · {STYLE_SHORT[range.playstyle]} ·{' '}
            {range.combinations.length} of 1,326 combinations before blockers
          </p>
          <p className="assume-note">
            Base % is the share of all starting hands this playstyle opens;
            position widens or tightens it.
          </p>
        </div>
      </section>
      <p className="assume-note">
        {result
          ? result.method === 'exact'
            ? `Equity is exact over ${result.trials.toLocaleString()} legal outcomes against ${result.validCombos} unblocked combinations.`
            : `Preflop equity is estimated from ${result.trials.toLocaleString()} seeded samples against ${result.validCombos} unblocked combinations.`
          : 'Equity is exact on the flop, turn and river, and sampled preflop.'}{' '}
        No rake, no future betting, full equity at showdown. Raise EV assumes no
        re-raise and is sensitivity analysis, not a solver.
      </p>
    </div>
  );
}
