import { useEffect, useRef, useState } from 'react';
import {
  ChartNoAxesCombined,
  CircleDot,
  LoaderCircle,
  Sparkles,
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

  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const aiRequestId = useRef(0);
  const analysisIdentity = result && math
    ? [
        range.position,
        range.playstyle,
        range.percentage.toFixed(4),
        result.equity.toFixed(8),
        math.potOdds.toFixed(8),
        math.ev.toFixed(8),
        pot.toFixed(4),
        call.toFixed(4),
      ].join('|')
    : 'empty';

  useEffect(() => {
    aiRequestId.current += 1;
    setAiExplanation(null);
    setAiError(null);
    setAiLoading(false);
  }, [analysisIdentity]);

  async function explainHand() {
    if (!result || !math) return;

    const requestId = ++aiRequestId.current;
    setAiLoading(true);
    setAiError(null);

    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          position: range.position,
          playstyle: range.playstyle,
          rangePercentage: range.percentage,
          equity: result.equity,
          potOdds: math.potOdds,
          ev: math.ev,
          pot,
          call,
          method: result.method,
        }),
      });

      const data = (await response.json()) as {
        explanation?: string;
        error?: string;
      };

      if (!response.ok || !data.explanation) {
        throw new Error(data.error ?? 'AI explanation is unavailable.');
      }

      if (requestId !== aiRequestId.current) return;
      setAiExplanation(data.explanation);
    } catch (requestError) {
      if (requestId !== aiRequestId.current) return;
      setAiError(
        requestError instanceof Error
          ? requestError.message
          : 'AI explanation is unavailable.',
      );
    } finally {
      if (requestId === aiRequestId.current) setAiLoading(false);
    }
  }

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

      {result && math && (
        <section
          aria-labelledby="ai-explanation-heading"
          className="mb-6 rounded-xl border border-violet-300/15 bg-violet-300/[0.035] p-5"
        >
          <div className="flex items-center gap-2">
            <Sparkles
              aria-hidden="true"
              className="size-4 text-violet-300"
              strokeWidth={1.7}
            />
            <h3
              id="ai-explanation-heading"
              className="text-sm font-medium text-slate-200"
            >
              AI hand explanation
            </h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            The math above stays authoritative. AI only explains the calculated
            result and its assumptions.
          </p>

          {!aiExplanation && (
            <button
              type="button"
              onClick={explainHand}
              disabled={aiLoading}
              className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-violet-300/20 bg-violet-300/10 px-4 text-sm font-medium text-violet-100 transition-colors hover:bg-violet-300/15 disabled:cursor-wait disabled:opacity-60"
            >
              {aiLoading ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin motion-reduce:animate-none"
                />
              ) : (
                <Sparkles aria-hidden="true" className="size-4" />
              )}
              {aiLoading ? 'Explaining…' : 'Explain this decision'}
            </button>
          )}

          {aiExplanation && (
            <div className="mt-4 whitespace-pre-line rounded-lg border border-white/[0.07] bg-black/10 p-4 text-sm leading-relaxed text-slate-300">
              {aiExplanation}
            </div>
          )}

          {aiError && (
            <p role="alert" className="mt-3 text-xs leading-relaxed text-rose-300">
              {aiError}
            </p>
          )}
        </section>
      )}

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
