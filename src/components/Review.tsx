import { useEffect, useMemo, useRef, useState } from 'react';
import { type ActiveSlot, type Card, sameCard } from '../cards';
import { useEquity } from '../poker/useEquity';
import { useOuts } from '../poker/useOuts';
import { validateScenario } from '../poker/scenario';
import {
  generateOpponentRange,
  type Playstyle,
  type Position,
} from '../poker/ranges';
import {
  bestAction,
  continuingCombinations,
  raiseMetrics,
  validateRaiseInputs,
} from '../poker/decision';
import { financialMetrics } from '../poker/metrics';
import type { EquityInput } from '../poker/equity';
import { pct } from '../lib/format';
import { AmountField } from './AmountField';
import {
  ActionTree,
  Assumptions,
  DecisionHead,
  OutsPanel,
  StreetRail,
  describeDecision,
  fmt,
} from './Analysis';
import { ALL_SLOTS, seatId, streetOf } from './CardSeat';
import { ChipSplit } from './ChipSplit';
import { DeckTray } from './DeckTray';
import type { CardMotion } from './PlayingCard';
import { RaiseTest } from './RaiseTest';
import { Room } from './Room';
import { Table } from './Table';
import { VillainSeat } from './VillainSeat';

const c = (rank: Card['rank'], suit: Card['suit']): Card => ({ rank, suit });

// The hand the entry deals. It stays in your hand when the table opens.
export const OPENING_HAND: [Card, Card] = [c('A', 'Spades'), c('K', 'Spades')];

// A close, classic spot computed by the engine: nut flush draw and two
// overcards on the turn facing a pot-sized bet from a tight opener.
// 37.0% equity against a 33.3% price; 15 outs (9 spades, 3 aces, 3 kings).
const EXAMPLE = {
  board: [
    c('8', 'Diamonds'),
    c('6', 'Spades'),
    c('3', 'Spades'),
    c('Q', 'Hearts'),
    null,
  ],
  position: 'UTG' as Position,
  playstyle: 'Nit' as Playstyle,
  pot: '90',
  call: '45',
  stack: '160',
};

export type ReviewPhase = 'hand' | 'price' | 'reading' | 'ready';

export function Review({
  start,
  fromEntry,
  onPhase,
}: {
  start: 'blank' | 'example';
  fromEntry: boolean;
  onPhase: (phase: ReviewPhase) => void;
}) {
  const example = start === 'example';
  const [holeCards, setHoleCards] = useState<(Card | null)[]>([
    ...OPENING_HAND,
  ]);
  const [communityCards, setCommunityCards] = useState<(Card | null)[]>(
    example ? EXAMPLE.board : [null, null, null, null, null],
  );
  const [opponentPosition, setOpponentPosition] = useState<Position>(
    example ? EXAMPLE.position : 'BTN',
  );
  const [opponentPlaystyle, setOpponentPlaystyle] = useState<Playstyle>(
    example ? EXAMPLE.playstyle : 'Tight-Aggressive',
  );
  const [potSize, setPotSize] = useState(example ? EXAMPLE.pot : '');
  const [callAmount, setCallAmount] = useState(example ? EXAMPLE.call : '');
  const [stackSize, setStackSize] = useState(example ? EXAMPLE.stack : '');
  const [raiseTo, setRaiseTo] = useState('');
  const [foldToRaise, setFoldToRaise] = useState('35');
  const [motions, setMotions] = useState<
    Record<string, CardMotion | undefined>
  >(() => {
    const initial: Record<string, CardMotion> = {};
    if (!fromEntry)
      ['hole-0', 'hole-1'].forEach((id, i) => {
        initial[id] = { kind: 'deal', delay: 120 + i * 140 };
      });
    if (example)
      ['community-0', 'community-1', 'community-2', 'community-3'].forEach(
        (id, i) => {
          initial[id] = {
            kind: 'deal',
            delay: (fromEntry ? 520 : 420) + i * 150,
          };
        },
      );
    return initial;
  });

  /* ---------- Poker state (unchanged from the original workspace) ---------- */

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
  const raiseValidation = validateRaiseInputs(
    scenario.call,
    stackSize,
    raiseTo,
    foldToRaise,
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

  const continueCombos = useMemo(
    () =>
      scenario.ready && raiseValidation.ready
        ? continuingCombinations(range, raiseValidation.foldEquity)
        : [],
    [range, raiseValidation.foldEquity, raiseValidation.ready, scenario.ready],
  );
  const raiseEquityInput = useMemo<EquityInput | null>(
    () =>
      scenario.ready &&
      raiseValidation.ready &&
      raiseValidation.foldEquity < 1 &&
      continueCombos.length
        ? {
            holeCards: holeCards as [Card, Card],
            communityCards: communityCards.filter(
              (card): card is Card => card !== null,
            ),
            opponentCombos: continueCombos,
          }
        : null,
    [
      holeCards,
      communityCards,
      continueCombos,
      scenario.ready,
      raiseValidation.ready,
      raiseValidation.foldEquity,
    ],
  );
  const raiseCalculation = useEquity(raiseEquityInput);

  // Outs only need the cards and the range, so they start counting early.
  const boardCards = communityCards.filter(
    (card): card is Card => card !== null,
  );
  const cardsForOuts =
    holeCards.every(Boolean) &&
    (boardCards.length === 3 || boardCards.length === 4) &&
    communityCards.slice(0, boardCards.length).every(Boolean);
  const outsInput = useMemo<EquityInput | null>(
    () =>
      cardsForOuts
        ? {
            holeCards: holeCards as [Card, Card],
            communityCards: communityCards.filter(
              (card): card is Card => card !== null,
            ),
            opponentCombos: range.combinations,
          }
        : null,
    [cardsForOuts, holeCards, communityCards, range],
  );
  const outs = useOuts(outsInput);

  /* ---------- Derived analysis (as in the original analysis panel) ---------- */

  const pot = scenario.pot;
  const call = scenario.call;
  const result = calculation.status === 'ready' ? calculation.result : null;
  const callMath = result ? financialMetrics(result.equity, pot, call) : null;
  const raiseResult =
    raiseCalculation.status === 'ready' ? raiseCalculation.result : null;
  const raiseEquity =
    raiseValidation.ready && raiseValidation.foldEquity >= 1
      ? 0
      : (raiseResult?.equity ?? null);
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
  const best = callMath ? bestAction(callMath.ev, raiseMath?.ev ?? null) : null;
  const verdict =
    result && callMath && best
      ? describeDecision({
          best,
          pot,
          call,
          equity: result.equity,
          callMath,
          raiseMath,
          raiseTo: raiseValidation.raiseTo,
          foldEquity: raiseValidation.foldEquity,
        })
      : null;

  const error = calculation.status === 'error' ? calculation.message : null;
  const ready = Boolean(result && callMath && verdict);
  const phase: ReviewPhase = ready
    ? 'ready'
    : holeCards.filter(Boolean).length < 2
      ? 'hand'
      : scenario.ready
        ? 'reading'
        : 'price';

  useEffect(() => onPhase(phase), [phase, onPhase]);

  /* ---------- Cards and the deck ---------- */

  const [activeSlot, setActiveSlot] = useState<ActiveSlot | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const cardAt = (slot: ActiveSlot) =>
    (slot.group === 'hole' ? holeCards : communityCards)[slot.index];
  const usedCards = [...holeCards, ...communityCards].filter(
    (card): card is Card => card !== null,
  );
  const selectedCard = activeSlot ? cardAt(activeSlot) : null;

  function updateSlot(slot: ActiveSlot, card: Card | null) {
    const setCards = slot.group === 'hole' ? setHoleCards : setCommunityCards;
    setCards((cards) =>
      cards.map((previous, index) => (index === slot.index ? card : previous)),
    );
  }

  function seatButton(slot: ActiveSlot) {
    return document.querySelector<HTMLElement>(
      `[data-seat="${seatId(slot)}"] .seat-hit`,
    );
  }

  function openSlot(slot: ActiveSlot, button: HTMLElement | null) {
    returnFocus.current = button;
    // Small screens: bring the seat above the tray so the card lands in view.
    if (button && window.innerWidth < 900) {
      const top = button.getBoundingClientRect().top;
      window.scrollBy({ top: top - window.innerHeight * 0.1 });
    }
    setActiveSlot(slot);
  }

  function selectCard(card: Card, from: DOMRect) {
    if (
      !activeSlot ||
      (usedCards.some((used) => sameCard(card, used)) &&
        !sameCard(card, selectedCard))
    )
      return;
    const slot = activeSlot;
    updateSlot(slot, card);
    setMotions((current) => ({
      ...current,
      [seatId(slot)]: { kind: 'fly', from },
    }));
    // Keep dealing the same street: the second hole card, the rest of the flop.
    const street = streetOf(slot);
    const next = street
      .slice(street.findIndex((s) => s.label === slot.label) + 1)
      .find((s) => !cardAt(s));
    if (next) {
      returnFocus.current = seatButton(next);
      setActiveSlot(next);
    } else {
      returnFocus.current = seatButton(slot);
      setActiveSlot(null);
    }
  }

  const nextEmpty = ALL_SLOTS.find((slot) => {
    if (cardAt(slot)) return false;
    // Streets deal in order: no turn before a complete flop.
    if (slot.group === 'community' && slot.index >= 3)
      return communityCards.slice(0, slot.index).every(Boolean);
    return true;
  });

  function clearTable() {
    setHoleCards([null, null]);
    setCommunityCards([null, null, null, null, null]);
    setMotions({});
  }

  function loadExample() {
    setHoleCards([...OPENING_HAND]);
    setCommunityCards([...EXAMPLE.board]);
    setOpponentPosition(EXAMPLE.position);
    setOpponentPlaystyle(EXAMPLE.playstyle);
    setPotSize(EXAMPLE.pot);
    setCallAmount(EXAMPLE.call);
    setStackSize(EXAMPLE.stack);
    setRaiseTo('');
    setFoldToRaise('35');
    const deal: Record<string, CardMotion> = {};
    [
      'hole-0',
      'hole-1',
      'community-0',
      'community-1',
      'community-2',
      'community-3',
    ].forEach((id, i) => {
      deal[id] = { kind: 'deal', delay: 80 + i * 130 };
    });
    setMotions(deal);
  }

  /* ---------- Layout ---------- */

  const street =
    boardCards.length === 0
      ? 'Preflop'
      : boardCards.length === 3
        ? 'Flop'
        : boardCards.length === 4
          ? 'Turn'
          : 'River';
  const potNumber = Number(potSize);
  const callNumber = Number(callAmount);
  const invalid = scenario.invalid;
  const potInvalid = invalid && /pot/i.test(scenario.message);
  const callInvalid = invalid && /call/i.test(scenario.message);
  const stackInvalid = invalid && /stack/i.test(scenario.message);

  return (
    <div className="review" data-ready={ready || undefined}>
      <div className="review-table felt">
        <Room review={ready} />
        <Table
          hole={holeCards}
          board={communityCards}
          motions={motions}
          activeSeat={activeSlot ? seatId(activeSlot) : null}
          onOpenSeat={openSlot}
          onClearSeat={(slot) => updateSlot(slot, null)}
          onDeal={
            nextEmpty
              ? () => openSlot(nextEmpty, seatButton(nextEmpty))
              : undefined
          }
          review={ready}
          villain={
            <VillainSeat
              range={range}
              onPosition={setOpponentPosition}
              onPlaystyle={setOpponentPlaystyle}
            />
          }
          money={{
            pot: Number.isFinite(potNumber) ? potNumber : null,
            call: Number.isFinite(callNumber) ? callNumber : null,
            stack: Number(stackSize) || null,
          }}
          betField={
            <AmountField
              id="call-amount"
              label="Bet"
              srLabel="to call"
              size="sm"
              value={callAmount}
              onChange={setCallAmount}
              invalid={callInvalid}
            />
          }
          potField={
            <AmountField
              id="pot-size"
              label="Pot"
              srLabel="size"
              size="lg"
              value={potSize}
              onChange={setPotSize}
              invalid={potInvalid}
              note="includes villain’s bet"
            />
          }
          stackField={
            <AmountField
              id="stack-size"
              label="Stack"
              srLabel="(yours)"
              size="sm"
              value={stackSize}
              onChange={setStackSize}
              invalid={stackInvalid}
              note={stackSize.trim() === '' ? 'optional' : undefined}
            />
          }
          equityNote={
            ready && result ? (
              <div className="table-stat">
                <span className="kicker">Equity</span>
                <span className="table-stat-value num">
                  {pct(result.equity)}
                </span>
              </div>
            ) : null
          }
          priceNote={
            ready && callMath && call > 0 ? (
              <span>
                <span className="kicker">Price</span>{' '}
                <span className="num">{pct(callMath.potOdds)}</span>
              </span>
            ) : null
          }
          footer={
            <div className="table-actions">
              <button type="button" className="text-btn" onClick={clearTable}>
                Clear cards
              </button>
              <button type="button" className="text-btn" onClick={loadExample}>
                Load the example hand
              </button>
            </div>
          }
        />
      </div>

      <div className="review-analysis" aria-live="polite">
        {ready && result && callMath && verdict && best ? (
          <div className="analysis">
            <DecisionHead
              verdict={verdict}
              equity={result.equity}
              result={result}
              callMath={callMath}
              call={call}
              pot={pot}
              context={
                call > 0 ? (
                  <>
                    {street} · facing <span className="num">{fmt(call)}</span>{' '}
                    into{' '}
                    <span className="num">{fmt(Math.max(0, pot - call))}</span>
                  </>
                ) : (
                  <>{street} · no bet</>
                )
              }
            />

            <section className="block" aria-labelledby="math-heading">
              <h3 id="math-heading" className="kicker block-title">
                The math, in chips
              </h3>
              <ChipSplit
                pot={pot}
                call={call}
                equity={result.equity}
                ev={callMath.ev}
              />
            </section>

            <section className="block" aria-labelledby="action-heading">
              <h3 id="action-heading" className="kicker block-title">
                The action
              </h3>
              <StreetRail hole={holeCards} board={communityCards} />
              <ActionTree
                pot={pot}
                call={call}
                street={street}
                best={verdict.action}
                callMath={callMath}
                raiseMath={raiseMath}
                raiseReady={raiseValidation.ready}
                raiseTo={raiseValidation.raiseTo}
                foldEquity={raiseValidation.foldEquity}
                raisePending={
                  raiseValidation.ready &&
                  raiseValidation.foldEquity < 1 &&
                  raiseCalculation.status === 'loading'
                }
                raiseEquity={raiseEquity}
                raiseMessage={
                  raiseValidation.ready ? undefined : raiseValidation.message
                }
              >
                {call > 0 && (
                  <RaiseTest
                    pot={pot}
                    call={call}
                    raiseTo={raiseTo}
                    onRaiseTo={setRaiseTo}
                    foldToRaise={foldToRaise}
                    onFoldToRaise={setFoldToRaise}
                    breakEven={raiseMath?.breakEvenFoldEquity ?? null}
                    message={
                      raiseValidation.ready ? '' : raiseValidation.message
                    }
                    invalid={raiseValidation.invalid}
                  />
                )}
              </ActionTree>
            </section>

            <section className="block" aria-labelledby="next-heading">
              <h3 id="next-heading" className="kicker block-title">
                The next card
              </h3>
              <OutsPanel state={outs} boardCount={boardCards.length} />
            </section>

            <section className="block" aria-labelledby="assume-heading">
              <h3 id="assume-heading" className="kicker block-title">
                Assumptions
              </h3>
              <Assumptions range={range} result={result} />
            </section>
          </div>
        ) : (
          <Guide
            phase={phase}
            hole={holeCards}
            boardCount={boardCards.length}
            pot={potSize}
            call={callAmount}
            message={error ?? scenario.message}
            invalid={Boolean(error) || scenario.invalid}
            onExample={loadExample}
            range={range}
          />
        )}
      </div>

      <DeckTray
        target={activeSlot}
        street={activeSlot ? streetOf(activeSlot) : []}
        cardAt={cardAt}
        locate={(card) =>
          holeCards.some((held) => sameCard(held, card))
            ? 'hand'
            : communityCards.some((dealt) => sameCard(dealt, card))
              ? 'board'
              : null
        }
        returnFocus={returnFocus}
        onClose={() => setActiveSlot(null)}
        onSelect={selectCard}
        onRemove={() => activeSlot && updateSlot(activeSlot, null)}
      />
    </div>
  );
}

function Guide({
  phase,
  hole,
  boardCount,
  pot,
  call,
  message,
  invalid,
  onExample,
  range,
}: {
  phase: ReviewPhase;
  hole: (Card | null)[];
  boardCount: number;
  pot: string;
  call: string;
  message: string;
  invalid: boolean;
  onExample: () => void;
  range: ReturnType<typeof generateOpponentRange>;
}) {
  const holeCount = hole.filter(Boolean).length;
  const headline =
    phase === 'hand'
      ? 'Deal your hand.'
      : phase === 'reading'
        ? 'Reading the table…'
        : 'Set the price.';
  const steps = [
    {
      n: '01',
      name: 'The hand',
      done: holeCount === 2,
      text:
        holeCount === 2
          ? 'Two hole cards dealt.'
          : 'Tap a seat or the deck to choose your two hole cards.',
    },
    {
      n: '02',
      name: 'The board',
      done: [0, 3, 4, 5].includes(boardCount),
      optional: true,
      text:
        boardCount === 0
          ? 'Optional. Leave it empty to review preflop.'
          : boardCount < 3
            ? 'Finish the flop: three cards.'
            : `${boardCount === 3 ? 'Flop' : boardCount === 4 ? 'Turn' : 'River'} dealt.`,
    },
    {
      n: '03',
      name: 'The price',
      done: pot.trim() !== '' && call.trim() !== '',
      text:
        pot.trim() !== '' && call.trim() !== ''
          ? `Pot ${pot} · bet ${call}.`
          : 'Write the pot and the bet to call on the table.',
    },
  ];
  return (
    <div className="guide">
      <p className="kicker">The decision</p>
      <p
        className="guide-title"
        data-reading={phase === 'reading' || undefined}
      >
        {headline}
      </p>
      <ol className="guide-steps">
        {steps.map((step) => (
          <li
            key={step.n}
            className="guide-step"
            data-done={step.done || undefined}
          >
            <span className="guide-n num">{step.n}</span>
            <span className="guide-name">{step.name}</span>
            <span className="guide-text">{step.text}</span>
            <span
              className="guide-check"
              aria-label={step.done ? 'done' : 'to do'}
            >
              {step.done ? (
                <svg viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M2.5 6.4l2.3 2.3 4.7-5" />
                </svg>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
      <p
        className="guide-message"
        role={invalid ? 'alert' : 'status'}
        data-invalid={invalid || undefined}
      >
        {phase === 'reading' ? 'Calculating your equity…' : message}
      </p>
      <p className="guide-villain">
        Up against: {range.position} · {range.playstyle} ·{' '}
        <span className="num">{range.percentage.toFixed(1)}%</span> of hands.
        Change it at the top of the table.
      </p>
      <button
        type="button"
        className="btn btn-quiet guide-example"
        onClick={onExample}
      >
        See the example hand
        <span className="btn-arrow" aria-hidden="true">
          →
        </span>
      </button>
    </div>
  );
}
