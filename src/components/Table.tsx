import type { ReactNode } from 'react';
import type { ActiveSlot, Card } from '../cards';
import { chipUnit, formatUnit } from '../lib/chips';
import { CardSeat, BOARD_SLOTS, HOLE_SLOTS, seatId } from './CardSeat';
import { ChipStacks } from './Chips';
import type { CardMotion } from './PlayingCard';
import { PlayingCard } from './PlayingCard';

export type Money = {
  pot: number | null;
  call: number | null;
  stack: number | null;
};

const amount = (value: number | null) =>
  value !== null && Number.isFinite(value) && value > 0 ? value : 0;

/**
 * The table is the interface: villain at the top, the money in the middle,
 * the board below it and your hand closest to you. Every chip here is sized
 * from the numbers written beside it.
 */
export function Table({
  hole,
  board,
  motions = {},
  activeSeat = null,
  readOnly = false,
  onOpenSeat,
  onClearSeat,
  onDeal,
  villain,
  money,
  potField,
  betField,
  stackField,
  equityNote,
  priceNote,
  review = false,
  footer,
  label = 'The table',
}: {
  hole: (Card | null)[];
  board: (Card | null)[];
  motions?: Record<string, CardMotion | undefined>;
  activeSeat?: string | null;
  readOnly?: boolean;
  onOpenSeat?: (slot: ActiveSlot, button: HTMLButtonElement) => void;
  onClearSeat?: (slot: ActiveSlot) => void;
  onDeal?: () => void;
  villain: ReactNode;
  money: Money;
  potField: ReactNode;
  betField: ReactNode;
  stackField: ReactNode;
  equityNote?: ReactNode;
  priceNote?: ReactNode;
  review?: boolean;
  footer?: ReactNode;
  label?: string;
}) {
  const pot = amount(money.pot);
  const call = amount(money.call);
  const stack = amount(money.stack);
  // The pot as entered already includes villain's bet; the bet sits in front
  // of villain and the rest of the pot sits in the middle.
  const middle = Math.max(0, pot - call);
  const unit = chipUnit([middle, call, stack]);
  const showLegend = middle > 0 || call > 0 || stack > 0;
  const boardCount = board.filter(Boolean).length;

  const seat = (slot: ActiveSlot, card: Card | null, quiet = false) => (
    <CardSeat
      key={seatId(slot)}
      slot={slot}
      card={card}
      motion={motions[seatId(slot)]}
      active={activeSeat === seatId(slot)}
      quiet={quiet}
      readOnly={readOnly}
      onOpen={onOpenSeat}
      onClear={onClearSeat}
    />
  );

  return (
    <section
      className="table"
      data-table
      data-review={review || undefined}
      aria-label={label}
    >
      <div className="table-line" aria-hidden="true" />

      <div className="table-top">
        <div className="table-villain">{villain}</div>
        {onDeal ? (
          <button
            type="button"
            className="deck"
            data-dealer
            onClick={onDeal}
            aria-label="Deal the next card"
            title="Deal the next card"
          >
            <span className="deck-card" />
            <span className="deck-card" />
            <span className="deck-card deck-top">
              <PlayingCard card={null} faceDown />
            </span>
          </button>
        ) : (
          <span className="deck" data-dealer aria-hidden="true">
            <span className="deck-card" />
            <span className="deck-card" />
            <span className="deck-card deck-top">
              <PlayingCard card={null} faceDown />
            </span>
          </span>
        )}
      </div>

      <div className="money">
        <div className="money-bet">
          <ChipStacks
            amount={call}
            unit={unit}
            kind="ivory"
            chipWidth={24}
            label={`Villain's bet: ${formatUnit(call)} big blinds in chips`}
          />
          {betField}
        </div>
        <div className="money-pot">
          <ChipStacks
            amount={middle}
            unit={unit}
            kind="ivory"
            chipWidth={28}
            label={`Pot before the bet: ${formatUnit(middle)} big blinds in chips`}
          />
          {potField}
          {priceNote && <div className="table-note">{priceNote}</div>}
        </div>
      </div>

      <div className="board">
        <p className="sr-only">The board</p>
        <div className="board-cards">
          <div className="board-street" data-street="flop">
            {BOARD_SLOTS.slice(0, 3).map((slot) =>
              seat(slot, board[slot.index]),
            )}
          </div>
          {seat(BOARD_SLOTS[3], board[3], boardCount < 3)}
          {seat(BOARD_SLOTS[4], board[4], boardCount < 4)}
        </div>
        <div className="board-labels" aria-hidden="true">
          <span className="board-label-flop">Flop</span>
          <span>Turn</span>
          <span>River</span>
        </div>
      </div>

      <div className="hero">
        <div className="hero-side hero-side-left">{equityNote}</div>
        <div className="hero-hand">
          <div className="hero-cards">
            {HOLE_SLOTS.map((slot) => seat(slot, hole[slot.index]))}
          </div>
          <p className="kicker kicker-gold hero-label">Your hand</p>
        </div>
        <div className="hero-side hero-side-right">
          <ChipStacks
            amount={stack}
            unit={unit}
            kind="onyx"
            chipWidth={24}
            label={`Your stack: ${formatUnit(stack)} big blinds in chips`}
          />
          {stackField}
        </div>
      </div>

      <div className="table-foot">
        {showLegend && (
          <p className="chip-legend">
            <svg
              viewBox="0 0 40 26"
              className="chip-legend-chip"
              aria-hidden="true"
            >
              <use href="#felt-chip-ivory" />
            </svg>
            1 chip = {formatUnit(unit)} BB
          </p>
        )}
        {footer}
      </div>
    </section>
  );
}
