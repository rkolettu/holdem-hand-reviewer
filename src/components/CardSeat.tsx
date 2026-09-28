import { useRef, type CSSProperties } from 'react';
import { type ActiveSlot, type Card, cardKey, cardName } from '../cards';
import { usePointerTilt } from '../lib/motion';
import { PlayingCard, type CardMotion } from './PlayingCard';

export const HOLE_SLOTS: ActiveSlot[] = [
  { group: 'hole', index: 0, label: 'Hole card 1' },
  { group: 'hole', index: 1, label: 'Hole card 2' },
];
export const BOARD_SLOTS: ActiveSlot[] = [
  { group: 'community', index: 0, label: 'Flop card 1' },
  { group: 'community', index: 1, label: 'Flop card 2' },
  { group: 'community', index: 2, label: 'Flop card 3' },
  { group: 'community', index: 3, label: 'Turn' },
  { group: 'community', index: 4, label: 'River' },
];
export const ALL_SLOTS = [...HOLE_SLOTS, ...BOARD_SLOTS];

export const seatId = (slot: ActiveSlot) => `${slot.group}-${slot.index}`;

/** The seats dealt together: the two hole cards, the three flop cards. */
export function streetOf(slot: ActiveSlot): ActiveSlot[] {
  if (slot.group === 'hole') return HOLE_SLOTS;
  if (slot.index < 3) return BOARD_SLOTS.slice(0, 3);
  return [BOARD_SLOTS[slot.index]];
}

// Dealt cards never land perfectly square.
const REST: Record<string, number> = {
  'hole-0': -2.4,
  'hole-1': 2,
  'community-0': 0.7,
  'community-1': -0.5,
  'community-2': 0.9,
  'community-3': -0.7,
  'community-4': 0.5,
};

export function CardSeat({
  slot,
  card,
  motion,
  active = false,
  quiet = false,
  readOnly = false,
  onOpen,
  onClear,
}: {
  slot: ActiveSlot;
  card: Card | null;
  motion?: CardMotion;
  active?: boolean;
  quiet?: boolean;
  readOnly?: boolean;
  onOpen?: (slot: ActiveSlot, button: HTMLButtonElement) => void;
  onClear?: (slot: ActiveSlot) => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  usePointerTilt(wrap, Boolean(card));
  const id = seatId(slot);
  const face = card ? (
    <PlayingCard key={cardKey(card)} card={card} motion={motion} />
  ) : (
    <span className="seat-empty" aria-hidden="true">
      <span className="seat-plus" />
    </span>
  );

  return (
    <div
      ref={wrap}
      className="seat"
      data-seat={id}
      data-filled={Boolean(card) || undefined}
      data-active={active || undefined}
      data-quiet={quiet || undefined}
      style={{ '--rest': `${REST[id] ?? 0}deg` } as CSSProperties}
    >
      {readOnly ? (
        <div className="seat-hit">
          <span className="sr-only">
            {card ? `${slot.label}: ${cardName(card)}` : `${slot.label}: empty`}
          </span>
          {face}
        </div>
      ) : (
        <button
          type="button"
          className="seat-hit"
          aria-haspopup="dialog"
          aria-label={
            card
              ? `Change ${slot.label}: ${cardName(card)}`
              : `Select ${slot.label}`
          }
          onClick={(event) => onOpen?.(slot, event.currentTarget)}
        >
          {face}
        </button>
      )}
      {card && !readOnly && onClear && (
        <button
          type="button"
          className="seat-clear"
          aria-label={`Clear ${slot.label}`}
          onClick={() => onClear(slot)}
        >
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <path d="M3 3l6 6M9 3l-6 6" />
          </svg>
        </button>
      )}
    </div>
  );
}
