import {
  ArrowUpRight,
  ChartNoAxesCombined,
  CircleDot,
  Diamond,
  Layers2,
  Spade,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';

function CardSlot({ label }: { label: string }) {
  return (
    <div
      role="img"
      aria-label={`${label}: empty card slot`}
      className="aspect-[5/7] w-full rounded-lg border border-dashed border-white/35 bg-white/[0.035] shadow-[inset_0_1px_0_rgb(255_255_255/0.025)] sm:rounded-xl"
    />
  );
}

function NumberField({ id, label }: { id: string; label: string }) {
  return (
    <div className="min-w-0 space-y-2.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-300">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          name={id}
          type="number"
          inputMode="decimal"
          aria-describedby="amount-unit"
          min="0"
          step="any"
          placeholder="0"
          className="h-12 rounded-xl border-white/10 bg-white/[0.035] px-4 pr-12 text-base text-slate-100 shadow-none placeholder:text-slate-500 focus-visible:border-emerald-400/60 focus-visible:ring-2 focus-visible:ring-emerald-400/20 md:text-base"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500"
        >
          BB
        </span>
      </div>
    </div>
  );
}

function Metric({
  title,
  description,
  unit,
}: {
  title: string;
  description: string;
  unit: string;
}) {
  return (
    <div className="border-b border-white/[0.07] py-7 first:pt-0">
      <dt className="flex items-center justify-between gap-3 text-sm font-medium text-slate-300">
        {title}
        <ArrowUpRight
          aria-hidden="true"
          className="size-4 text-slate-600"
          strokeWidth={1.5}
        />
      </dt>
      <dd className="mt-3">
        <div className="flex items-baseline gap-2">
          <span
            aria-label="Not available"
            className="font-mono text-4xl font-light tracking-tight text-slate-500"
          >
            —
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

export default function App() {
  return (
    <div className="min-h-dvh bg-[#0c141a] font-sans text-slate-100 antialiased lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
      <main className="flex min-w-0 flex-col lg:min-h-dvh">
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
              <p className="text-xs text-slate-400">
                Texas Hold’em · Hand Reviewer
              </p>
            </div>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-400">
            No-limit Hold’em
          </span>
        </header>

        <section
          aria-labelledby="table-heading"
          className="felt relative isolate flex min-h-[510px] flex-1 flex-col overflow-hidden px-5 pb-9 pt-7 sm:min-h-[590px] sm:px-9"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[6%] bottom-[9%] top-[16%] -z-10 rounded-[45%] border border-white/[0.055]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[7%] bottom-[10.5%] top-[17.5%] -z-10 rounded-[45%] border border-white/[0.025]"
          />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-200/60">
                Your workspace
              </p>
              <h1
                id="table-heading"
                className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl"
              >
                Review a hand
              </h1>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-emerald-100/60">
              <span className="size-1.5 rounded-full bg-[#d6bc79]" />
              Empty table
            </div>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center pb-2 pt-12 sm:pt-14">
            <section
              aria-labelledby="community-heading"
              className="w-full max-w-[520px]"
            >
              <h2
                id="community-heading"
                className="mb-5 text-center text-xs font-medium uppercase tracking-[0.22em] text-emerald-100/70"
              >
                Community cards
              </h2>
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                <CardSlot label="Flop card 1" />
                <CardSlot label="Flop card 2" />
                <CardSlot label="Flop card 3" />
                <CardSlot label="Turn" />
                <CardSlot label="River" />
              </div>
              <div
                aria-hidden="true"
                className="mt-3 grid grid-cols-5 gap-2 text-center text-xs text-emerald-100/50 sm:gap-3"
              >
                <span className="col-span-3">Flop</span>
                <span>Turn</span>
                <span>River</span>
              </div>
            </section>
            <section
              aria-labelledby="hole-heading"
              className="mt-9 w-[min(36%,204px)] sm:mt-10"
            >
              <h2
                id="hole-heading"
                className="mb-4 whitespace-nowrap text-center text-xs font-medium uppercase tracking-[0.22em] text-[#d6bc79]"
              >
                Your hole cards
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <CardSlot label="Hole card 1" />
                <CardSlot label="Hole card 2" />
              </div>
            </section>
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-emerald-100/50">
            <Diamond aria-hidden="true" className="size-3 shrink-0" />
            Every decision starts with the right information.
          </div>
        </section>

        <section
          aria-labelledby="details-heading"
          className="border-t border-white/[0.07] bg-[#0e181e] px-5 py-6 sm:px-9 sm:py-7"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <h2
              id="details-heading"
              className="flex items-center gap-2 text-sm font-medium text-slate-200"
            >
              <Layers2 aria-hidden="true" className="size-4 text-slate-500" />
              Hand details
            </h2>
            <p id="amount-unit" className="text-xs text-slate-500">
              Amounts in big blinds (BB)
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 min-[380px]:grid-cols-2 xl:grid-cols-4">
            <NumberField id="stack-size" label="Stack Size" />
            <NumberField id="pot-size" label="Pot Size" />
            <NumberField id="call-amount" label="Call Amount" />
            <div className="min-w-0 space-y-2.5">
              <label
                htmlFor="position"
                className="block text-sm font-medium text-slate-300"
              >
                Position
              </label>
              <NativeSelect
                id="position"
                name="position"
                defaultValue=""
                className="w-full [&_select]:h-12 [&_select]:rounded-xl [&_select]:border-white/10 [&_select]:bg-white/[0.035] [&_select]:pl-4 [&_select]:text-base [&_select]:text-slate-300 [&_select]:focus-visible:border-emerald-400/60 [&_select]:focus-visible:ring-emerald-400/20"
              >
                <NativeSelectOption value="" disabled>
                  Select position
                </NativeSelectOption>
                <NativeSelectOption value="utg">
                  Under the Gun
                </NativeSelectOption>
                <NativeSelectOption value="mp">
                  Middle Position
                </NativeSelectOption>
                <NativeSelectOption value="hj">Hijack</NativeSelectOption>
                <NativeSelectOption value="co">Cutoff</NativeSelectOption>
                <NativeSelectOption value="btn">Button</NativeSelectOption>
                <NativeSelectOption value="sb">Small Blind</NativeSelectOption>
                <NativeSelectOption value="bb">Big Blind</NativeSelectOption>
              </NativeSelect>
            </div>
          </div>
        </section>
      </main>

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
          A clearer picture of your next move.
        </p>
        <div className="my-7 flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2.5 text-xs text-slate-400">
          <CircleDot aria-hidden="true" className="size-3.5 text-slate-500" />
          Awaiting hand details
        </div>
        <dl>
          <Metric
            title="Pot Odds"
            unit="%"
            description="The price of continuing in the hand."
          />
          <Metric
            title="Estimated Equity"
            unit="%"
            description="Your estimated share of the pot."
          />
          <Metric
            title="Expected Value (EV)"
            unit="BB"
            description="The potential value of your decision."
          />
        </dl>
        <section
          aria-labelledby="verdict-heading"
          className="my-7 min-h-44 rounded-xl border border-[#d6bc79]/15 bg-[#d6bc79]/[0.035] p-5"
        >
          <h3
            id="verdict-heading"
            className="text-xs font-medium uppercase tracking-[0.16em] text-[#d6bc79]"
          >
            Final Verdict
          </h3>
          <p className="mt-5 text-lg font-medium tracking-tight text-slate-300">
            The next move is yours.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Your hand summary and decision insights will appear here.
          </p>
        </section>
        <p className="mt-auto flex items-center gap-2 pt-4 text-xs text-slate-500">
          <Spade aria-hidden="true" className="size-3.5" />
          Study the hand. Sharpen your game.
        </p>
      </aside>
    </div>
  );
}
