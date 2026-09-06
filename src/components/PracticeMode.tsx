import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CircleDot,
  RotateCcw,
  Spade,
  Target,
  Trophy,
} from 'lucide-react';
import { suitStyle, type Card } from '../cards';
import { generateOpponentRange } from '../poker/ranges';
import { useEquity } from '../poker/useEquity';
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

function StaticCard({ card }: { card: Card }) {
  const style = suitStyle[card.suit];
  return (
    <div className="flex aspect-[5/7] w-[58px] flex-col justify-between rounded-xl border border-black/10 bg-[#f7f4eb] p-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.18)] sm:w-[72px] sm:p-3">
      <span className={`text-lg font-semibold leading-none sm:text-xl ${style.cardColor}`}>
        {card.rank}
      </span>
      <span className={`self-end text-2xl leading-none sm:text-3xl ${style.cardColor}`}>
        {style.symbol}
      </span>
    </div>
  );
}

function ActionValue({
  label,
  value,
  best,
}: {
  label: string;
  value: number;
  best: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        best
          ? 'border-[#d6bc79]/45 bg-[#d6bc79]/[0.08]'
          : 'border-white/[0.08] bg-white/[0.025]'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-slate-300">{label}</span>
        {best && (
          <span className="rounded-full bg-[#d6bc79]/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#f1dba3]">
            Best EV
          </span>
        )}
      </div>
      <p
        className={`mt-3 font-mono text-2xl tabular-nums ${
          value > 0
            ? 'text-emerald-300'
            : value < 0
              ? 'text-rose-300'
              : 'text-slate-100'
        }`}
      >
        {value > 0 ? '+' : ''}
        {value.toFixed(2)} <span className="text-sm text-slate-500">BB</span>
      </p>
    </div>
  );
}

function actionLabel(action: DecisionAction, scenario: PracticeScenario) {
  return action === 'fold'
    ? 'Fold'
    : action === 'call'
      ? `Call ${scenario.call.toFixed(1)} BB`
      : `Raise to ${scenario.raiseTo.toFixed(1)} BB`;
}

export function PracticeMode({ onExit }: { onExit: () => void }) {
  const [scenario, setScenario] = useState(() => generatePracticeScenario());
  const [choice, setChoice] = useState<DecisionAction | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);

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
  }

  return (
    <div className="min-h-dvh bg-[#0c141a] font-sans text-slate-100 antialiased">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-5 sm:px-9">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl border border-[#d6bc79]/25 bg-[#d6bc79]/[0.07]">
            <Spade
              aria-hidden="true"
              className="size-5 fill-[#d6bc79] text-[#d6bc79]"
              strokeWidth={1.5}
            />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">
              The Felt<span className="text-[#d6bc79]">.</span>
            </p>
            <p className="text-xs text-slate-400">Texas Hold’em · Decision Lab</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Hand review
        </button>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-7 sm:px-9 sm:py-10">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-200/60">
              Practice mode
            </p>
            <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
              Make the decision before seeing the math.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
              Each spot has one modeled raise size and an explicit fold-to-raise
              assumption. Pick the action with the highest expected value.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-center">
              <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">
                Score
              </p>
              <p className="mt-1 font-mono text-lg text-slate-100">
                {correct}/{attempts}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-center">
              <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">
                Streak
              </p>
              <p className="mt-1 font-mono text-lg text-[#d6bc79]">{streak}</p>
            </div>
            <button
              type="button"
              onClick={nextHand}
              className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-center transition-colors hover:bg-white/[0.05]"
            >
              <RotateCcw aria-hidden="true" className="mx-auto size-4 text-slate-400" />
              <span className="mt-1 block text-[10px] uppercase tracking-[0.15em] text-slate-500">
                New hand
              </span>
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
          <section className="felt relative overflow-hidden rounded-2xl border border-white/[0.07] p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-100/55">
                  {streetName(scenario.board)} decision
                </p>
                <p className="mt-1 text-sm text-emerald-50/80">
                  Villain: {scenario.position} · {scenario.playstyle}
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-black/10 px-3 py-1.5 text-xs text-emerald-50/65">
                Stack {scenario.stack.toFixed(0)} BB
              </div>
            </div>

            <div className="mt-10">
              <p className="mb-4 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-emerald-100/55">
                Board
              </p>
              <div className="flex min-h-[102px] items-center justify-center gap-2 sm:gap-3">
                {scenario.board.map((card, index) => (
                  <StaticCard key={`${card.rank}-${card.suit}-${index}`} card={card} />
                ))}
              </div>
            </div>

            <div className="mt-8">
              <p className="mb-4 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-[#d6bc79]">
                Your hand
              </p>
              <div className="flex justify-center gap-3">
                {scenario.holeCards.map((card, index) => (
                  <StaticCard key={`${card.rank}-${card.suit}-${index}`} card={card} />
                ))}
              </div>
            </div>

            <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-white/[0.07] bg-black/10 p-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-emerald-100/45">
                  Pot now
                </p>
                <p className="mt-2 font-mono text-lg text-emerald-50">
                  {scenario.pot.toFixed(1)} BB
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-black/10 p-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-emerald-100/45">
                  To call
                </p>
                <p className="mt-2 font-mono text-lg text-emerald-50">
                  {scenario.call.toFixed(1)} BB
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-black/10 p-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-emerald-100/45">
                  Raise option
                </p>
                <p className="mt-2 font-mono text-lg text-emerald-50">
                  {scenario.raiseTo.toFixed(1)} BB
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-black/10 p-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-emerald-100/45">
                  Folds to raise
                </p>
                <p className="mt-2 font-mono text-lg text-emerald-50">
                  {(scenario.foldEquity * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </section>

          <aside className="rounded-2xl border border-white/[0.08] bg-slate-900 p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Target aria-hidden="true" className="size-5 text-[#d6bc79]" />
              <h2 className="text-lg font-medium">What’s your play?</h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Fold is 0 BB EV. Call and raise are scored from showdown equity and
              the stated opponent assumptions.
            </p>

            <div className="mt-6 grid gap-3">
              {(['fold', 'call', 'raise'] as DecisionAction[]).map((action) => (
                <button
                  key={action}
                  type="button"
                  disabled={!ready || choice !== null}
                  onClick={() => choose(action)}
                  className={`min-h-14 rounded-xl border px-4 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                    choice === action
                      ? isCorrect
                        ? 'border-emerald-400/45 bg-emerald-400/10 text-emerald-200'
                        : 'border-rose-400/45 bg-rose-400/10 text-rose-200'
                      : 'border-white/10 bg-white/[0.025] text-slate-200 hover:bg-white/[0.055] disabled:opacity-50'
                  }`}
                >
                  {actionLabel(action, scenario)}
                </button>
              ))}
            </div>

            {!ready && (
              <div className="mt-5 flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-3 text-xs text-slate-400">
                <CircleDot aria-hidden="true" className="size-4 animate-pulse" />
                Calculating both opponent ranges…
              </div>
            )}

            {choice && best && callMath && raiseMath && callResult && raiseResult && (
              <div className="mt-6 border-t border-white/[0.08] pt-6">
                <div
                  className={`rounded-xl border p-4 ${
                    isCorrect
                      ? 'border-emerald-400/25 bg-emerald-400/[0.05]'
                      : 'border-rose-400/25 bg-rose-400/[0.05]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Trophy
                      aria-hidden="true"
                      className={`size-4 ${isCorrect ? 'text-emerald-300' : 'text-rose-300'}`}
                    />
                    <p className={`font-medium ${isCorrect ? 'text-emerald-200' : 'text-rose-200'}`}>
                      {isCorrect ? 'Correct.' : `Best action: ${actionLabel(best, scenario)}.`}
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    The engine picks the highest EV under this scenario’s explicit
                    range and fold assumptions.
                  </p>
                </div>

                <div className="mt-4 grid gap-3">
                  <ActionValue label="Fold" value={0} best={best === 'fold'} />
                  <ActionValue label="Call" value={callMath.ev} best={best === 'call'} />
                  <ActionValue
                    label={`Raise to ${scenario.raiseTo.toFixed(1)} BB`}
                    value={raiseMath.ev}
                    best={best === 'raise'}
                  />
                </div>

                <div className="mt-5 space-y-2 text-xs leading-relaxed text-slate-400">
                  <p>
                    Call: {formatPercent(callResult.equity)} equity vs. the full
                    {` ${range.percentage.toFixed(1)}%`} range; pot odds are
                    {` ${formatPercent(callMath.potOdds)}`}.
                  </p>
                  <p>
                    Raise: villain folds {(scenario.foldEquity * 100).toFixed(0)}%;
                    when called, your equity is {formatPercent(raiseResult.equity)}
                    against the stronger continue range. This size needs roughly
                    {` ${(raiseMath.breakEvenFoldEquity * 100).toFixed(1)}%`} folds
                    to break even.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={nextHand}
                  className="mt-6 w-full rounded-xl bg-[#d6bc79] px-4 py-3 text-sm font-semibold text-[#172018] transition-opacity hover:opacity-90"
                >
                  Next hand →
                </button>
              </div>
            )}
          </aside>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-slate-500">
          Practice mode is a study model, not a solver. Opponent opening ranges,
          fold-to-raise rates, and the assumption that villain continues with the
          strongest portion of their range are explicit simplifications.
        </p>
      </main>
    </div>
  );
}

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
