import {
  ChartNoAxesCombined,
  CircleDot,
  LoaderCircle,
  Spade,
} from 'lucide-react';
import type { EquityState } from '../poker/useEquity';
import type { OpponentRange } from '../poker/ranges';
import { financialMetrics } from '../poker/metrics';

function Metric({
  title,
  value,
  unit,
  description,
  color = 'text-slate-100',
}: {
  title: string;
  value: string;
  unit: string;
  description: string;
  color?: string;
}) {
  return (
    <div className="border-b border-white/[0.07] py-5">
      <dt className="text-sm font-medium text-slate-300">{title}</dt>
      <dd className="mt-3">
        <div className="flex items-baseline gap-2">
          <span
            className={`font-mono text-3xl tracking-tight tabular-nums ${color}`}
          >
            {value}
          </span>
          <span className="text-sm text-slate-500">{unit}</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          {description}
        </p>
      </dd>
    </div>
  );
}
const formatPercent = (value: number) => (value * 100).toFixed(1);
export function AnalysisPanel({
  range,
  calculation,
  validation,
  pot,
  call,
}: {
  range: OpponentRange;
  calculation: EquityState;
  validation: { message: string; invalid: boolean };
  pot: number;
  call: number;
}) {
  const result = calculation.status === 'ready' ? calculation.result : null;
  const math = result ? financialMetrics(result.equity, pot, call) : null;
  const error = calculation.status === 'error' ? calculation.message : null;
  const pending = calculation.status === 'loading';
  const message =
    error ??
    (pending
      ? 'Calculating your equity…'
      : result
        ? 'Analysis ready'
        : validation.message);
  const verdict = math?.verdict;
  const positive = verdict === 'call' || verdict === 'check';
  const negative = verdict === 'fold';
  const color = positive
    ? 'text-emerald-300'
    : negative
      ? 'text-rose-300'
      : 'text-[#d6bc79]';
  const verdictTitle =
    verdict === 'call'
      ? '+EV Decision'
      : verdict === 'fold'
        ? '-EV Decision'
        : verdict === 'neutral'
          ? 'Break-even decision'
          : verdict === 'check'
            ? 'No call required'
            : pending
              ? 'Reviewing the hand…'
              : 'Complete your hand';
  const verdictBody =
    verdict === 'call'
      ? 'A call has positive expected value under this opponent range.'
      : verdict === 'fold'
        ? 'Folding is favored: a call has negative expected value under this opponent range.'
        : verdict === 'neutral'
          ? 'Calling and folding have equal expected value in this model.'
          : verdict === 'check'
            ? 'There is no bet to call. Checking costs nothing.'
            : message;
  return (
    <aside
      aria-labelledby="analysis-heading"
      className="flex min-w-0 flex-col border-t border-white/[0.08] bg-slate-900 px-6 py-7 sm:px-9 lg:border-l lg:border-t-0 lg:px-7 xl:px-9"
    >
      <div className="flex items-center gap-3">
        <ChartNoAxesCombined
          aria-hidden="true"
          className="size-5 text-[#d6bc79]"
          strokeWidth={1.5}
        />
        <h2
          id="analysis-heading"
          className="text-lg font-medium tracking-tight"
        >
          Hand analysis
        </h2>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        Your hand against one assumed opponent.
      </p>
      <section
        aria-label="Opponent range"
        className="mt-6 rounded-xl border border-white/10 bg-white/[0.025] p-4"
      >
        <p className="text-sm text-slate-300">
          Villain Range:{' '}
          <strong className="font-mono font-medium text-[#d6bc79]">
            {range.percentage.toFixed(1)}%
          </strong>
        </p>
        <p className="mt-1.5 text-xs text-slate-400">
          {range.position} · {range.playstyle}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          {range.combinations.length} of 1,326 starting combinations, before
          known cards are removed.
        </p>
      </section>
      <div
        role={error || validation.invalid ? 'alert' : 'status'}
        className={`mt-5 flex items-start gap-2 rounded-lg border px-3 py-3 text-sm leading-relaxed ${error || validation.invalid ? 'border-rose-400/25 bg-rose-400/5 text-rose-300' : 'border-white/[0.06] bg-white/[0.025] text-slate-400'}`}
      >
        {pending ? (
          <LoaderCircle
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 animate-spin motion-reduce:animate-none"
          />
        ) : (
          <CircleDot aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        )}
        {message}
      </div>
      <dl>
        <Metric
          title="Pot Odds"
          value={math ? formatPercent(math.potOdds) : '—'}
          unit="%"
          description={
            math
              ? `${call.toFixed(1)} BB to call into ${(pot + call).toFixed(1)} BB after calling.`
              : 'Required equity to break even on a call.'
          }
        />
        <Metric
          title={
            result?.method === 'exact' ? 'Exact Equity' : 'Estimated Equity'
          }
          value={result ? formatPercent(result.equity) : '—'}
          unit="%"
          description={
            result
              ? `Win ${formatPercent(result.win)}% · Tie ${formatPercent(result.tie)}% · Loss ${formatPercent(result.loss)}%`
              : 'Win probability plus half the tie probability.'
          }
        />
        <Metric
          title="Expected Value (EV)"
          value={math ? `${math.ev > 0 ? '+' : ''}${math.ev.toFixed(2)}` : '—'}
          unit="BB"
          color={math ? color : 'text-slate-100'}
          description="Net value of calling compared with folding."
        />
      </dl>
      {result && (
        <p className="mt-3 text-xs leading-relaxed text-slate-400">
          {result.method === 'exact'
            ? `Exact over ${result.trials.toLocaleString()} legal outcomes.`
            : `Estimate from ${result.trials.toLocaleString()} repeatable samples. 95% sampling margin ≈ ±${formatPercent(result.marginOfError ?? 0)} percentage points.`}{' '}
          {result.validCombos} unblocked opponent combinations.
        </p>
      )}
      <section
        aria-labelledby="verdict-heading"
        className={`my-6 rounded-xl border p-5 ${positive ? 'border-emerald-400/25 bg-emerald-400/[0.05]' : negative ? 'border-rose-400/25 bg-rose-400/[0.05]' : 'border-[#d6bc79]/15 bg-[#d6bc79]/[0.035]'}`}
      >
        <h3
          id="verdict-heading"
          className={`text-xs font-medium uppercase tracking-[0.16em] ${color}`}
        >
          Final Verdict
        </h3>
        <p className={`mt-4 text-lg font-medium tracking-tight ${color}`}>
          {verdictTitle}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          {verdictBody}
        </p>
        {math && (
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            Equity {formatPercent(result!.equity)}%{' '}
            {verdict === 'neutral'
              ? '='
              : result!.equity > math.potOdds
                ? '>'
                : '≤'}{' '}
            pot odds {formatPercent(math.potOdds)}%.{' '}
            {result!.method === 'estimated'
              ? 'Small edges may be within sampling uncertainty.'
              : ''}
          </p>
        )}
      </section>
      <p className="text-xs leading-relaxed text-slate-500">
        Model assumes full showdown equity against a fixed range, with no rake,
        future bets, or side pots. The pot includes the opponent’s bet before
        your call.
      </p>
      <p className="mt-auto flex items-center gap-2 pt-6 text-xs text-slate-500">
        <Spade aria-hidden="true" className="size-3.5" />
        Study the hand. Sharpen your game.
      </p>
    </aside>
  );
}
