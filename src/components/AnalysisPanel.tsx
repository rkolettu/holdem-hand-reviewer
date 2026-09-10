import {
  ChartNoAxesCombined,
  CircleDot,
  LoaderCircle,
  Scale,
  Spade,
  TrendingUp,
} from 'lucide-react';
import type { EquityState } from '../poker/useEquity';
import type { OpponentRange } from '../poker/ranges';
import { financialMetrics } from '../poker/metrics';
import {
  bestAction,
  raiseMetrics,
  type RaiseValidation,
} from '../poker/decision';

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

function EvRow({
  label,
  value,
  loading = false,
  best = false,
}: {
  label: string;
  value: number | null;
  loading?: boolean;
  best?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 ${
        best
          ? 'border-[#d6bc79]/40 bg-[#d6bc79]/[0.07]'
          : 'border-white/[0.07] bg-white/[0.02]'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-300">{label}</span>
        {best && (
          <span className="rounded-full bg-[#d6bc79]/15 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.15em] text-[#f1dba3]">
            Best EV
          </span>
        )}
      </div>
      {loading ? (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-slate-500" />
      ) : value === null ? (
        <span className="text-xs text-slate-500">Not modeled</span>
      ) : (
        <span
          className={`font-mono text-sm tabular-nums ${
            value > 0
              ? 'text-emerald-300'
              : value < 0
                ? 'text-rose-300'
                : 'text-slate-200'
          }`}
        >
          {value > 0 ? '+' : ''}
          {value.toFixed(2)} BB
        </span>
      )}
    </div>
  );
}

const formatPercent = (value: number) => (value * 100).toFixed(1);

export function AnalysisPanel({
  range,
  calculation,
  raiseCalculation,
  validation,
  raiseValidation,
  pot,
  call,
  continueComboCount,
}: {
  range: OpponentRange;
  calculation: EquityState;
  raiseCalculation: EquityState;
  validation: { message: string; invalid: boolean };
  raiseValidation: RaiseValidation;
  pot: number;
  call: number;
  continueComboCount: number;
}) {
  const result = calculation.status === 'ready' ? calculation.result : null;
  const callMath = result ? financialMetrics(result.equity, pot, call) : null;
  const raiseResult =
    raiseCalculation.status === 'ready' ? raiseCalculation.result : null;

  const raiseEquity =
    raiseValidation.ready && raiseValidation.foldEquity >= 1
      ? 0
      : raiseResult?.equity ?? null;
  const raiseMath =
    raiseValidation.ready && raiseEquity !== null
      ? raiseMetrics(
          raiseEquity,
          pot,
          call,
          raiseValidation.raiseTo,
          raiseValidation.foldEquity,
        )
      : null;

  const error = calculation.status === 'error' ? calculation.message : null;
  const pending = calculation.status === 'loading';
  const message =
    error ??
    (pending
      ? 'Calculating your equity…'
      : result
        ? 'Call analysis ready'
        : validation.message);

  const best = callMath ? bestAction(callMath.ev, raiseMath?.ev ?? null) : null;
  const callColor = callMath
    ? callMath.ev > 0
      ? 'text-emerald-300'
      : callMath.ev < 0
        ? 'text-rose-300'
        : 'text-[#d6bc79]'
    : 'text-slate-100';

  const bestTitle =
    best === 'raise'
      ? `Raise to ${raiseValidation.raiseTo.toFixed(1)} BB`
      : best === 'call'
        ? 'Call'
        : best === 'fold'
          ? 'Fold'
          : 'Complete your hand';

  const bestBody =
    best === 'raise' && raiseMath
      ? `The modeled raise has the highest EV at ${raiseMath.ev >= 0 ? '+' : ''}${raiseMath.ev.toFixed(2)} BB.`
      : best === 'call' && callMath
        ? `Calling has the highest entered-action EV at ${callMath.ev >= 0 ? '+' : ''}${callMath.ev.toFixed(2)} BB.`
        : best === 'fold'
          ? 'Folding keeps the decision at 0 BB EV, which beats the modeled alternatives.'
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
          Decision math
        </h2>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        Compare fold, call, and a modeled raise against one assumed opponent.
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
          {range.combinations.length} of 1,326 starting combinations before
          blockers are removed.
        </p>
      </section>

      <div
        role={error || validation.invalid ? 'alert' : 'status'}
        className={`mt-5 flex items-start gap-2 rounded-lg border px-3 py-3 text-sm leading-relaxed ${
          error || validation.invalid
            ? 'border-rose-400/25 bg-rose-400/5 text-rose-300'
            : 'border-white/[0.06] bg-white/[0.025] text-slate-400'
        }`}
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
          value={callMath ? formatPercent(callMath.potOdds) : '—'}
          unit="%"
          description={
            callMath
              ? `${call.toFixed(1)} BB to call into ${(pot + call).toFixed(1)} BB after calling.`
              : 'Required showdown equity to break even on a call.'
          }
        />
        <Metric
          title={result?.method === 'exact' ? 'Exact Equity' : 'Estimated Equity'}
          value={result ? formatPercent(result.equity) : '—'}
          unit="%"
          description={
            result
              ? `Win ${formatPercent(result.win)}% · Tie ${formatPercent(result.tie)}% · Loss ${formatPercent(result.loss)}%`
              : 'Your showdown equity against the selected full range.'
          }
        />
        <Metric
          title="Call EV"
          value={callMath ? `${callMath.ev > 0 ? '+' : ''}${callMath.ev.toFixed(2)}` : '—'}
          unit="BB"
          color={callColor}
          description="Net expected value of calling compared with folding now."
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

      <section className="my-6 border-y border-white/[0.07] py-6">
        <div className="flex items-center gap-2">
          <Scale aria-hidden="true" className="size-4 text-[#d6bc79]" />
          <h3 className="text-sm font-medium text-slate-200">Action comparison</h3>
        </div>
        <div className="mt-4 space-y-2.5">
          <EvRow label="Fold" value={0} best={best === 'fold'} />
          <EvRow label="Call" value={callMath?.ev ?? null} best={best === 'call'} />
          <EvRow
            label={
              raiseValidation.ready
                ? `Raise to ${raiseValidation.raiseTo.toFixed(1)} BB`
                : 'Raise'
            }
            value={raiseMath?.ev ?? null}
            loading={
              raiseValidation.ready &&
              raiseValidation.foldEquity < 1 &&
              raiseCalculation.status === 'loading'
            }
            best={best === 'raise'}
          />
        </div>

        {!raiseValidation.ready && callMath && (
          <p
            className={`mt-3 text-xs leading-relaxed ${
              raiseValidation.invalid ? 'text-rose-300' : 'text-slate-500'
            }`}
          >
            {raiseValidation.message}
          </p>
        )}
      </section>

      <section
        aria-labelledby="best-action-heading"
        className={`rounded-xl border p-5 ${
          best === 'raise'
            ? 'border-[#d6bc79]/25 bg-[#d6bc79]/[0.045]'
            : best === 'call'
              ? 'border-emerald-400/25 bg-emerald-400/[0.05]'
              : best === 'fold'
                ? 'border-rose-400/20 bg-rose-400/[0.04]'
                : 'border-white/[0.08] bg-white/[0.025]'
        }`}
      >
        <h3
          id="best-action-heading"
          className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400"
        >
          Highest modeled EV
        </h3>
        <p className="mt-4 text-lg font-medium tracking-tight text-slate-100">
          {bestTitle}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{bestBody}</p>
      </section>

      {raiseValidation.ready && raiseMath && (
        <section className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <div className="flex items-center gap-2">
            <TrendingUp aria-hidden="true" className="size-4 text-[#d6bc79]" />
            <h3 className="text-sm font-medium text-slate-200">Raise breakdown</h3>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-black/10 p-3">
              <p className="text-[10px] uppercase tracking-[0.13em] text-slate-500">
                Folds assumed
              </p>
              <p className="mt-2 font-mono text-lg text-slate-100">
                {formatPercent(raiseValidation.foldEquity)}%
              </p>
            </div>
            <div className="rounded-lg bg-black/10 p-3">
              <p className="text-[10px] uppercase tracking-[0.13em] text-slate-500">
                Continue combos
              </p>
              <p className="mt-2 font-mono text-lg text-slate-100">
                {continueComboCount}
              </p>
            </div>
            <div className="rounded-lg bg-black/10 p-3">
              <p className="text-[10px] uppercase tracking-[0.13em] text-slate-500">
                Equity if called
              </p>
              <p className="mt-2 font-mono text-lg text-slate-100">
                {raiseValidation.foldEquity >= 1
                  ? 'N/A'
                  : raiseResult
                    ? `${formatPercent(raiseResult.equity)}%`
                    : '—'}
              </p>
            </div>
            <div className="rounded-lg bg-black/10 p-3">
              <p className="text-[10px] uppercase tracking-[0.13em] text-slate-500">
                Break-even folds
              </p>
              <p className="mt-2 font-mono text-lg text-slate-100">
                {formatPercent(raiseMath.breakEvenFoldEquity)}%
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-400">
            If called, the final pot is {raiseMath.finalPotIfCalled.toFixed(1)} BB
            and the called branch is {raiseMath.calledBranchEv >= 0 ? '+' : ''}
            {raiseMath.calledBranchEv.toFixed(2)} BB EV. The model assumes villain
            folds the weakest part of the selected range and continues with the
            strongest remaining combos.
          </p>
        </section>
      )}

      <p className="mt-6 text-xs leading-relaxed text-slate-500">
        Model assumes full showdown equity, no rake, no future betting, no side
        pots, and no re-raise after your modeled raise. Raise analysis is
        sensitivity analysis, not a GTO recommendation.
      </p>
      <p className="mt-auto flex items-center gap-2 pt-6 text-xs text-slate-500">
        <Spade aria-hidden="true" className="size-3.5" />
        Equity, pot odds, and expected value.
      </p>
    </aside>
  );
}
