import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { Dialog } from '@base-ui/react/dialog';
import {
  type ActiveSlot,
  type Card,
  cardName,
  ranks,
  sameCard,
  suitInfo,
  suits,
} from '../cards';
import { PlayingCard } from './PlayingCard';
import { SuitGlyph } from './SuitGlyph';

const ORDER = [...ranks].reverse(); // A K Q J 10 … 2, the way players read a deck
const RANK_KEYS: Record<string, Card['rank']> = {
  a: 'A',
  k: 'K',
  q: 'Q',
  j: 'J',
  t: '10',
  '1': '10',
  '0': '10',
  '9': '9',
  '8': '8',
  '7': '7',
  '6': '6',
  '5': '5',
  '4': '4',
  '3': '3',
  '2': '2',
};
const SUIT_KEYS: Record<string, Card['suit']> = {
  s: 'Spades',
  h: 'Hearts',
  d: 'Diamonds',
  c: 'Clubs',
};

function streetTitle(slot: ActiveSlot) {
  if (slot.group === 'hole') return 'Your hand';
  if (slot.index < 3) return 'The flop';
  return slot.index === 3 ? 'The turn' : 'The river';
}

export function DeckTray({
  target,
  street,
  cardAt,
  locate,
  returnFocus,
  onClose,
  onSelect,
  onRemove,
}: {
  target: ActiveSlot | null;
  street: ActiveSlot[];
  cardAt: (slot: ActiveSlot) => Card | null;
  locate: (card: Card) => 'hand' | 'board' | null;
  returnFocus: RefObject<HTMLElement | null>;
  onClose: () => void;
  onSelect: (card: Card, from: DOMRect) => void;
  onRemove: () => void;
}) {
  const deck = useRef<HTMLDivElement>(null);
  const [pendingRank, setPendingRank] = useState<Card['rank'] | null>(null);
  const selected = target ? cardAt(target) : null;
  const position = target
    ? street.findIndex((s) => s.label === target.label)
    : -1;

  // Dealing the rest of a street: keep keyboard focus in the deck, on the next
  // card after the one just placed.
  const targetLabel = target?.label;
  useEffect(() => {
    if (!targetLabel) return;
    const frame = requestAnimationFrame(() => {
      const cards = [
        ...(deck.current?.querySelectorAll<HTMLButtonElement>('[data-card]') ??
          []),
      ];
      const active = document.activeElement as HTMLButtonElement | null;
      if (active && cards.includes(active) && !active.disabled) return;
      const from = active ? cards.indexOf(active) : -1;
      (
        cards.slice(from + 1).find((card) => !card.disabled) ??
        cards.find((card) => !card.disabled)
      )?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [targetLabel]);

  useEffect(() => {
    if (!pendingRank) return;
    const timer = setTimeout(() => setPendingRank(null), 1600);
    return () => clearTimeout(timer);
  }, [pendingRank]);

  function pick(card: Card) {
    const button = deck.current?.querySelector<HTMLButtonElement>(
      `[data-card="${card.rank}-${card.suit}"]`,
    );
    if (!button || button.disabled) return;
    onSelect(card, button.getBoundingClientRect());
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    const key = event.key.toLowerCase();
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    // Arrow keys move through the deck by what is on screen, so they work for
    // the 13-column desktop tray and the wrapped mobile tray alike.
    const current = (event.target as HTMLElement).closest<HTMLButtonElement>(
      '[data-card]',
    );
    if (current && key.startsWith('arrow')) {
      event.preventDefault();
      const open = [
        ...(deck.current?.querySelectorAll<HTMLButtonElement>(
          '[data-card]:not(:disabled)',
        ) ?? []),
      ];
      if (key === 'arrowleft' || key === 'arrowright') {
        const index = open.indexOf(current);
        open[index + (key === 'arrowright' ? 1 : -1)]?.focus();
        return;
      }
      const from = current.getBoundingClientRect();
      const down = key === 'arrowdown';
      let best: HTMLButtonElement | undefined;
      let bestScore = Infinity;
      for (const button of open) {
        const rect = button.getBoundingClientRect();
        const dy = down ? rect.top - from.top : from.top - rect.top;
        if (dy < from.height / 2) continue;
        const score = dy * 4 + Math.abs(rect.left - from.left);
        if (score < bestScore) {
          bestScore = score;
          best = button;
        }
      }
      best?.focus();
      return;
    }

    // Type a card: a rank, then a suit (A then S deals A♠).
    if (pendingRank && SUIT_KEYS[key]) {
      event.preventDefault();
      pick({ rank: pendingRank, suit: SUIT_KEYS[key] });
      setPendingRank(null);
      return;
    }
    if (RANK_KEYS[key]) {
      event.preventDefault();
      setPendingRank(RANK_KEYS[key]);
    }
  }

  return (
    <Dialog.Root
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="tray-backdrop" />
        <Dialog.Popup
          className="tray"
          onKeyDown={onKeyDown}
          finalFocus={returnFocus}
          initialFocus={() =>
            deck.current?.querySelector<HTMLButtonElement>(
              selected
                ? `[data-card="${selected.rank}-${selected.suit}"]`
                : '[data-card]:not(:disabled)',
            ) ?? true
          }
        >
          <div className="tray-head">
            <div>
              <p className="kicker kicker-gold">
                {target ? streetTitle(target) : 'The deck'}
                {street.length > 1 && position >= 0 && (
                  <span className="tray-count num">
                    {' '}
                    · Card {position + 1} of {street.length}
                  </span>
                )}
              </p>
              <Dialog.Title className="tray-title">
                {target?.label ?? 'Choose a card'}
              </Dialog.Title>
              <Dialog.Description className="tray-desc">
                Choose a card
                <span className="tray-type-hint">
                  , or type it: <kbd>A</kbd> then <kbd>S</kbd> for A♠
                </span>
                . Cards on the table are set aside.
              </Dialog.Description>
            </div>
            <Dialog.Close className="icon-btn tray-close" aria-label="Close">
              <svg viewBox="0 0 12 12" aria-hidden="true">
                <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
              </svg>
            </Dialog.Close>
          </div>

          {street.length > 1 && (
            <div className="tray-street" aria-hidden="true">
              {street.map((slot) => {
                const card = cardAt(slot);
                return (
                  <span
                    key={slot.label}
                    className="tray-slot"
                    data-current={slot.label === target?.label || undefined}
                  >
                    {card ? (
                      <PlayingCard card={card} />
                    ) : (
                      <span className="tray-slot-empty" />
                    )}
                  </span>
                );
              })}
            </div>
          )}

          <div className="tray-deck" ref={deck}>
            {suits.map((suit) => (
              <fieldset
                key={suit}
                className="tray-suit"
                data-tone={suitInfo[suit].tone}
              >
                <legend className="sr-only">{suit}</legend>
                <span className="tray-suit-label" aria-hidden="true">
                  <SuitGlyph suit={suit} className="tray-suit-glyph" />
                </span>
                <div className="tray-row">
                  {ORDER.map((rank) => {
                    const card: Card = { rank, suit };
                    const isSelected = sameCard(card, selected);
                    const where = locate(card);
                    const unavailable = where !== null && !isSelected;
                    return (
                      <button
                        key={rank}
                        type="button"
                        className="tray-card"
                        data-card={`${rank}-${suit}`}
                        disabled={unavailable}
                        aria-pressed={isSelected}
                        aria-label={cardName(card)}
                        title={
                          unavailable
                            ? where === 'hand'
                              ? 'In your hand'
                              : 'On the board'
                            : undefined
                        }
                        onClick={(event) =>
                          onSelect(
                            card,
                            event.currentTarget.getBoundingClientRect(),
                          )
                        }
                      >
                        <PlayingCard card={card} />
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>

          <div className="tray-foot">
            <p className="tray-typed" aria-live="polite">
              {pendingRank ? (
                <>
                  <span className="num">{pendingRank}</span> — now a suit:{' '}
                  <kbd>S</kbd> <kbd>H</kbd> <kbd>D</kbd> <kbd>C</kbd>
                </>
              ) : (
                <span className="tray-hint">
                  Arrow keys move · Enter places · Esc closes
                </span>
              )}
            </p>
            {selected && (
              <button type="button" className="text-btn" onClick={onRemove}>
                Take this card back
              </button>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
