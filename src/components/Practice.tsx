import { useEffect, useMemo, useState } from 'react';
import type { Card } from '../cards';
import { generateOpponentRange } from '../poker/ranges';
import { useEquity } from '../poker/useEquity';
import { useOuts } from '../poker/useOuts';
import type { EquityInput } from '../poker/equity';
import { financialMetrics } from '../poker/metrics';
import {
  bestAction,
  continuingCombinations,
  raiseMetrics,
  type DecisionAction,
} from '../poker/decision';
import {
  generatePracticeScenario,
  streetName,
  type PracticeScenario,
} from '../poker/practice';
import { pct } from '../lib/format';
import {
  ActionTree,
  Assumptions,
  DecisionHead,
  OutsPanel,
  StreetRail,
  describeDecision,
  fmt,
} from './Analysis';
import { AmountField } from './AmountField';
import { ChipSplit } from './ChipSplit';
import type { CardMotion } from './PlayingCard';
import { Room } from './Room';
import { Table } from './Table';
import { VillainSeat } from './VillainSeat';

function actionLabel(action: DecisionAction, scenario: PracticeScenario) {
  return action === 'fold'
    ? 'Fold'
    : action === 'call'
      ? `Call ${fmt(scenario.call)}`
      : `Raise to ${fmt(scenario.raiseTo)}`;
}

const KEYS: Record<string, DecisionAction> = {
  f: 'fold',
  c: 'call',
  r: 'raise',
};

export function Practice({
  onScore,
}: {
  onScore: (score: {
    correct: number;
    attempts: number;
    streak: number;
  }) => void;
}) {
  const [scenario, setScenario] = useState(() => generatePracticeScenario());
  const [hand, setHand] = useState(0);
  const [choice, setChoice] = useState<DecisionAction | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);

  /* ---------- Poker state (unchanged from the original practice mode) ---------- */

  const range = useMemo(
    () => generateOpponentRange(scenario.position, scenario.playstyle),
    [scenario.position, scenario.playstyle],
  );
  const continueCombos = useMemo(
    () => continuingCombinations(range, scenario.foldEquity),
    [range, scenario.foldEquity],
  );
  const callInput = useMemo<EquityInput>(
    () => ({
      holeCards: scenario.holeCards,
      communityCards: scenario.board,
      opponentCombos: range.combinations,
    }),
    [scenario, range],
  );
  const raiseInput = useMemo<EquityInput>(
    () => ({
      holeCards: scenario.holeCards,
      communityCards: scenario.board,
      opponentCombos: continueCombos,
    }),
    [scenario, continueCombos],
  );
  const callCalculation = useEquity(callInput);
  const raiseCalculation = useEquity(raiseInput);
  const outs = useOuts(scenario.board.length < 5 ? callInput : null);

  const callResult =
    callCalculation.status === 'ready' ? callCalculation.result : null;
  const raiseResult =
    raiseCalculation.status === 'ready' ? raiseCalculation.result : null;
  const callMath = callResult
    ? financialMetrics(callResult.equity, scenario.pot, scenario.call)
    : null;
  const raiseMath = raiseResult
    ? raiseMetrics(
        raiseResult.equity,
        scenario.pot,
        scenario.call,
        scenario.raiseTo,
        scenario.foldEquity,
      )
    : null;
  const ready = Boolean(callMath && raiseMath);
  const best =
    callMath && raiseMath ? bestAction(callMath.ev, raiseMath.ev) : null;
  const isCorrect = choice !== null && best !== null && choice === best;
  const revealed = Boolean(
    choice && best && callMath && raiseMath && callResult,
  );

  useEffect(
    () => onScore({ correct, attempts, streak }),
    [correct, attempts, streak, onScore],
  );

  function choose(action: DecisionAction) {
    if (!ready || choice || !best) return;
    setChoice(action);
    setAttempts((value) => value + 1);
    if (action === best) {
      setCorrect((value) => value + 1);
      setStreak((value) => value + 1);
    } else {
      setStreak(0);
    }
  }

  function nextHand() {
    setChoice(null);
    setScenario(generatePracticeScenario());
    setHand((value) => value + 1);
    window.scrollTo({ top: 0 });
  }

  // F, C, R to act; N for the next hand.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (target.closest('input, textarea, select, [role="dialog"]')) return;
      const key = event.key.toLowerCase();
      if (KEYS[key]) choose(KEYS[key]);
      else if (key === 'n' && choice) nextHand();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const board: (Card | null)[] = [
    ...scenario.board,
    ...Array<null>(5 - scenario.board.length).fill(null),
  ];
  const motions: Record<string, CardMotion> = {};
  [
    'hole-0',
    'hole-1',
    'community-0',
    'community-1',
    'community-2',
    'community-3',
    'community-4',
  ].forEach((id, i) => {
    motions[id] = { kind: 'deal', delay: 100 + i * 120 };
  });
  const verdict =
    revealed && best && callMath && callResult
      ? describeDecision({
          best,
          pot: scenario.pot,
          call: scenario.call,
          equity: callResult.equity,
          callMath,
          raiseMath,
          raiseTo: scenario.raiseTo,
          foldEquity: scenario.foldEquity,
        })
      : null;
  const street = streetName(scenario.board);

  return (
    <div className="review practice" data-ready={revealed || undefined}>
      <div className="review-table felt">
        <Room review={revealed} />
        <Table
          key={hand}
          hole={scenario.holeCards}
          board={board}
          motions={motions}
          readOnly
          review={revealed}
          label="Practice table"
          villain={<VillainSeat range={range} readOnly />}
          money={{
            pot: scenario.pot,
            call: scenario.call,
            stack: scenario.stack,
          }}
          betField={
            <AmountField
              id="p-bet"
              label="Bet"
              size="sm"
              value={fmt(scenario.call)}
              readOnly
            />
          }
          potField={
            <AmountField
              id="p-pot"
              label="Pot"
              size="lg"
              value={fmt(scenario.pot)}
              readOnly
              note="includes villain’s bet"
            />
          }
          stackField={
            <AmountField
              id="p-stack"
              label="Stack"
              size="sm"
              value={fmt(scenario.stack)}
              readOnly
            />
          }
          equityNote={
            revealed && callResult ? (
              <div className="table-stat">
                <span className="kicker">Equity</span>
                <span className="table-stat-value num">
                  {pct(callResult.equity)}
                </span>
              </div>
            ) : null
          }
          priceNote={
            revealed && callMath ? (
              <span>
                <span className="kicker">Price</span>{' '}
                <span className="num">{pct(callMath.potOdds)}</span>
              </span>
            ) : null
          }
        />
      </div>

      <div className="review-analysis">
        <div className="analysis">
          <section className="move" aria-labelledby="move-heading">
            <div className="decision-top">
              <h2 id="move-heading" className="kicker">
                Your move
              </h2>
              <p className="decision-context">
                {street} · facing{' '}
                <span className="num">{fmt(scenario.call)}</span> into{' '}
                <span className="num">{fmt(scenario.pot - scenario.call)}</span>
              </p>
            </div>
            <p className="move-title">
              {choice
                ? isCorrect
                  ? 'Right call.'
                  : 'Not this time.'
                : 'What’s the play?'}
            </p>
            <div className="move-actions">
              {(['fold', 'call', 'raise'] as DecisionAction[]).map((action) => (
                <button
                  key={action}
                  type="button"
                  className="move-btn"
                  disabled={!ready || choice !== null}
                  aria-pressed={choice === action}
                  data-best={(choice && best === action) || undefined}
                  onClick={() => choose(action)}
                >
                  <span className="move-key" aria-hidden="true">
                    {action[0].toUpperCase()}
                  </span>
                  {actionLabel(action, scenario)}
                  {choice && best === action && (
                    <span className="move-tag">Best EV</span>
                  )}
                  {choice === action && best !== action && (
                    <span className="move-tag move-tag-quiet">Your pick</span>
                  )}
                </button>
              ))}
            </div>
            <p className="move-note">
              {!ready ? (
                <span className="pending">Reading the table</span>
              ) : choice && best ? (
                isCorrect ? (
                  <>
                    {actionLabel(best, scenario)} has the highest expected value
                    under this spot’s assumptions.
                  </>
                ) : (
                  <>
                    The highest expected value here is{' '}
                    <strong>{actionLabel(best, scenario)}</strong>.
                  </>
                )
              ) : (
                <>
                  Fold is 0 BB. If you raise, villain is assumed to fold{' '}
                  <span className="num">{pct(scenario.foldEquity, 0)}</span> of
                  the time. Keys: F, C, R.
                </>
              )}
            </p>
          </section>

          {revealed && verdict && best && callMath && callResult && (
            <>
              <DecisionHead
                verdict={verdict}
                equity={callResult.equity}
                result={callResult}
                callMath={callMath}
                call={scenario.call}
                pot={scenario.pot}
                context={<>Modeled best action</>}
              />
              <section className="block" aria-labelledby="p-math-heading">
                <h3 id="p-math-heading" className="kicker block-title">
                  The math, in chips
                </h3>
                <ChipSplit
                  pot={scenario.pot}
                  call={scenario.call}
                  equity={callResult.equity}
                  ev={callMath.ev}
                />
              </section>
              <section className="block" aria-labelledby="p-action-heading">
                <h3 id="p-action-heading" className="kicker block-title">
                  The action
                </h3>
                <StreetRail hole={scenario.holeCards} board={board} />
                <ActionTree
                  pot={scenario.pot}
                  call={scenario.call}
                  street={street}
                  best={verdict.action}
                  callMath={callMath}
                  raiseMath={raiseMath}
                  raiseReady
                  raiseTo={scenario.raiseTo}
                  foldEquity={scenario.foldEquity}
                  raisePending={false}
                  raiseEquity={raiseResult?.equity ?? null}
                />
              </section>
              <section className="block" aria-labelledby="p-next-heading">
                <h3 id="p-next-heading" className="kicker block-title">
                  The next card
                </h3>
                <OutsPanel state={outs} boardCount={scenario.board.length} />
              </section>
              <section className="block" aria-labelledby="p-assume-heading">
                <h3 id="p-assume-heading" className="kicker block-title">
                  Assumptions
                </h3>
                <Assumptions range={range} result={callResult} />
                <p className="assume-note">
                  Practice fold-to-raise rates are simple archetype assumptions,
                  adjusted slightly for raise size.
                </p>
              </section>
            </>
          )}

          <div className="practice-foot">
            <button
              type="button"
              className={`btn ${choice ? 'btn-primary' : 'btn-quiet'}`}
              onClick={nextHand}
            >
              {choice ? 'Next hand' : 'Skip this hand'}
              <span className="btn-arrow" aria-hidden="true">
                →
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
