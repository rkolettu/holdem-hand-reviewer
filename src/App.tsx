import { useRef, useState, useMemo, type MouseEvent } from 'react';
import { AnalysisPanel } from './components/AnalysisPanel';
import { useEquity } from './poker/useEquity';
import { validateScenario } from './poker/scenario';
import {
  generateOpponentRange,
  PLAYSTYLES,
  BASE_RANGES,
  type Position,
  type Playstyle,
} from './poker/ranges';
import type { EquityInput } from './poker/equity';
import { Button } from '@/components/ui/button';
import { CardSlot } from './components/CardSlot';
import { CardPicker } from './components/CardPicker';
import { type Card, type ActiveSlot, sameCard } from './cards';
import { Diamond, Layers2, Spade } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';

function NumberField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-0 space-y-2.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-300">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          name={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
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

export default function App() {
  const [holeCards, setHoleCards] = useState<(Card | null)[]>([null, null]);
  const [communityCards, setCommunityCards] = useState<(Card | null)[]>([
    null,
    null,
    null,
    null,
    null,
  ]);
  const [opponentPosition, setOpponentPosition] = useState<Position>('BTN');
  const [opponentPlaystyle, setOpponentPlaystyle] =
    useState<Playstyle>('Tight-Aggressive');
  const [potSize, setPotSize] = useState('');
  const [callAmount, setCallAmount] = useState('');
  const [stackSize, setStackSize] = useState('');
  const range = useMemo(
    () => generateOpponentRange(opponentPosition, opponentPlaystyle),
    [opponentPosition, opponentPlaystyle],
  );
  const scenario = validateScenario(
    holeCards,
    communityCards,
    potSize,
    callAmount,
    stackSize,
  );
  const equityInput = useMemo<EquityInput | null>(
    () =>
      scenario.ready
        ? {
            holeCards: holeCards as [Card, Card],
            communityCards: communityCards.filter(
              (card): card is Card => card !== null,
            ),
            opponentCombos: range.combinations,
          }
        : null,
    [holeCards, communityCards, range, scenario.ready],
  );
  const calculation = useEquity(equityInput);
  const [activeSlot, setActiveSlot] = useState<ActiveSlot | null>(null);
  const slotButton = useRef<HTMLButtonElement | null>(null);
  const usedCards = [...holeCards, ...communityCards].filter(
    (card): card is Card => card !== null,
  );
  const selectedCard = activeSlot
    ? (activeSlot.group === 'hole' ? holeCards : communityCards)[
        activeSlot.index
      ]
    : null;

  function updateSlot(slot: ActiveSlot, card: Card | null) {
    const setCards = slot.group === 'hole' ? setHoleCards : setCommunityCards;
    setCards((cards) =>
      cards.map((previous, index) => (index === slot.index ? card : previous)),
    );
  }

  function openSlot(slot: ActiveSlot, event: MouseEvent<HTMLButtonElement>) {
    slotButton.current = event.currentTarget;
    setActiveSlot(slot);
  }

  function selectCard(card: Card) {
    if (
      !activeSlot ||
      (usedCards.some((used) => sameCard(card, used)) &&
        !sameCard(card, selectedCard))
    )
      return;
    updateSlot(activeSlot, card);
    setActiveSlot(null);
  }

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
              {usedCards.length
                ? `${usedCards.length}/7 cards selected`
                : 'Empty table'}
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
                <CardSlot
                  label="Flop card 1"
                  card={communityCards[0]}
                  onOpen={(event) =>
                    openSlot(
                      { group: 'community', index: 0, label: 'Flop card 1' },
                      event,
                    )
                  }
                  onClear={() =>
                    updateSlot(
                      { group: 'community', index: 0, label: 'Flop card 1' },
                      null,
                    )
                  }
                />
                <CardSlot
                  label="Flop card 2"
                  card={communityCards[1]}
                  onOpen={(event) =>
                    openSlot(
                      { group: 'community', index: 1, label: 'Flop card 2' },
                      event,
                    )
                  }
                  onClear={() =>
                    updateSlot(
                      { group: 'community', index: 1, label: 'Flop card 2' },
                      null,
                    )
                  }
                />
                <CardSlot
                  label="Flop card 3"
                  card={communityCards[2]}
                  onOpen={(event) =>
                    openSlot(
                      { group: 'community', index: 2, label: 'Flop card 3' },
                      event,
                    )
                  }
                  onClear={() =>
                    updateSlot(
                      { group: 'community', index: 2, label: 'Flop card 3' },
                      null,
                    )
                  }
                />
                <CardSlot
                  label="Turn"
                  card={communityCards[3]}
                  onOpen={(event) =>
                    openSlot(
                      { group: 'community', index: 3, label: 'Turn' },
                      event,
                    )
                  }
                  onClear={() =>
                    updateSlot(
                      { group: 'community', index: 3, label: 'Turn' },
                      null,
                    )
                  }
                />
                <CardSlot
                  label="River"
                  card={communityCards[4]}
                  onOpen={(event) =>
                    openSlot(
                      { group: 'community', index: 4, label: 'River' },
                      event,
                    )
                  }
                  onClear={() =>
                    updateSlot(
                      { group: 'community', index: 4, label: 'River' },
                      null,
                    )
                  }
                />
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
                <CardSlot
                  label="Hole card 1"
                  card={holeCards[0]}
                  onOpen={(event) =>
                    openSlot(
                      { group: 'hole', index: 0, label: 'Hole card 1' },
                      event,
                    )
                  }
                  onClear={() =>
                    updateSlot(
                      { group: 'hole', index: 0, label: 'Hole card 1' },
                      null,
                    )
                  }
                />
                <CardSlot
                  label="Hole card 2"
                  card={holeCards[1]}
                  onOpen={(event) =>
                    openSlot(
                      { group: 'hole', index: 1, label: 'Hole card 2' },
                      event,
                    )
                  }
                  onClear={() =>
                    updateSlot(
                      { group: 'hole', index: 1, label: 'Hole card 2' },
                      null,
                    )
                  }
                />
              </div>
            </section>
          </div>
          <fieldset className="mt-8 border-t border-white/10 pt-5">
            <legend className="px-2 text-sm font-medium text-emerald-100/80">
              Opponent Playstyle
            </legend>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {PLAYSTYLES.map((style) => (
                <Button
                  key={style}
                  type="button"
                  variant="ghost"
                  aria-label={style}
                  aria-pressed={opponentPlaystyle === style}
                  onClick={() => setOpponentPlaystyle(style)}
                  className={`h-auto min-h-16 cursor-pointer flex-col gap-1 whitespace-normal rounded-xl border px-2 py-3 text-sm transition-colors focus-visible:ring-[#d6bc79] ${opponentPlaystyle === style ? 'border-[#d6bc79]/70 bg-[#d6bc79]/15 text-[#f1dba3] hover:bg-[#d6bc79]/20' : 'border-white/10 bg-black/10 text-emerald-100/70 hover:border-white/25 hover:bg-white/5'}`}
                >
                  <span>{style}</span>
                  <span className="text-xs font-normal opacity-70">
                    Base {BASE_RANGES[style]}%
                  </span>
                </Button>
              ))}
            </div>
          </fieldset>
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-emerald-100/50">
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
            <NumberField
              id="stack-size"
              label="Stack Size"
              value={stackSize}
              onChange={setStackSize}
            />
            <NumberField
              id="pot-size"
              label="Pot Size"
              value={potSize}
              onChange={setPotSize}
            />
            <NumberField
              id="call-amount"
              label="Call Amount"
              value={callAmount}
              onChange={setCallAmount}
            />
            <div className="min-w-0 space-y-2.5">
              <label
                htmlFor="position"
                className="block text-sm font-medium text-slate-300"
              >
                Opponent Position
              </label>
              <NativeSelect
                id="position"
                name="position"
                value={opponentPosition}
                onChange={(event) =>
                  setOpponentPosition(event.target.value as Position)
                }
                className="w-full [&_select]:h-12 [&_select]:rounded-xl [&_select]:border-white/10 [&_select]:bg-white/[0.035] [&_select]:pl-4 [&_select]:text-base [&_select]:text-slate-300 [&_select]:focus-visible:border-emerald-400/60 [&_select]:focus-visible:ring-emerald-400/20"
              >
                <NativeSelectOption value="UTG">
                  Under the Gun
                </NativeSelectOption>
                <NativeSelectOption value="MP">
                  Middle Position
                </NativeSelectOption>
                <NativeSelectOption value="HJ">Hijack</NativeSelectOption>
                <NativeSelectOption value="CO">Cutoff</NativeSelectOption>
                <NativeSelectOption value="BTN">Button</NativeSelectOption>
                <NativeSelectOption value="SB">Small Blind</NativeSelectOption>
                <NativeSelectOption value="BB">Big Blind</NativeSelectOption>
              </NativeSelect>
            </div>
          </div>
        </section>
      </main>

      <AnalysisPanel
        range={range}
        calculation={calculation}
        validation={scenario}
        pot={scenario.pot}
        call={scenario.call}
      />
      <CardPicker
        activeSlot={activeSlot}
        selectedCard={selectedCard}
        usedCards={usedCards}
        returnFocus={slotButton}
        onClose={() => setActiveSlot(null)}
        onSelect={selectCard}
      />
    </div>
  );
}
