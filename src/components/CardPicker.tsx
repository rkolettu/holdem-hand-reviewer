import type { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  type ActiveSlot,
  type Card,
  ranks,
  suits,
  suitStyle,
  sameCard,
} from '../cards';

export function CardPicker({
  activeSlot,
  selectedCard,
  usedCards,
  returnFocus,
  onClose,
  onSelect,
}: {
  activeSlot: ActiveSlot | null;
  selectedCard: Card | null;
  usedCards: Card[];
  returnFocus: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onSelect: (card: Card) => void;
}) {
  return (
    <Dialog
      open={activeSlot !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        finalFocus={returnFocus}
        className="card-picker max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl gap-6 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 text-slate-100 shadow-[0_32px_100px_rgb(0_0_0/0.6)] ring-white/5 sm:max-w-3xl sm:p-7 lg:left-[35%] lg:max-w-[calc(70vw-3rem)] xl:max-w-3xl [&_[data-slot=dialog-close]]:size-9 [&_[data-slot=dialog-close]]:cursor-pointer [&_[data-slot=dialog-close]]:text-slate-400 [&_[data-slot=dialog-close]]:hover:bg-slate-800 [&_[data-slot=dialog-close]]:hover:text-white"
      >
        <DialogHeader className="pr-8">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#d6bc79]">
            {activeSlot?.label ?? 'Card selection'}
          </p>
          <DialogTitle className="mt-1 text-2xl font-medium tracking-tight">
            Choose a card
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm leading-relaxed text-slate-400">
            Select a rank and suit. Cards already on the table are unavailable.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          {suits.map((suit) => (
            <fieldset key={suit}>
              <legend
                className={`mb-2.5 flex items-center gap-2 text-sm font-medium ${suitStyle[suit].labelColor}`}
              >
                <span
                  aria-hidden="true"
                  className="font-serif text-xl leading-none"
                >
                  {suitStyle[suit].symbol}
                </span>
                {suit}
              </legend>
              <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-13">
                {ranks.map((rank) => {
                  const card: Card = { rank, suit };
                  const selected = sameCard(card, selectedCard);
                  const unavailable =
                    usedCards.some((used) => sameCard(card, used)) && !selected;
                  return (
                    <Button
                      key={rank}
                      type="button"
                      variant="ghost"
                      disabled={unavailable}
                      aria-label={`${rank} of ${suit}`}
                      aria-pressed={selected}
                      title={unavailable ? 'Already on the table' : undefined}
                      onClick={() => onSelect(card)}
                      className={`h-14 min-w-0 cursor-pointer flex-col gap-0.5 rounded-md border p-0 font-semibold shadow-sm transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-[#d6bc79] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-20 ${selected ? 'border-[#d6bc79] bg-[#fff4d5] ring-2 ring-[#d6bc79]' : 'border-slate-300 bg-slate-200'} ${suitStyle[suit].cardColor}`}
                    >
                      <span className="text-base leading-none">{rank}</span>
                      <span
                        aria-hidden="true"
                        className="font-serif text-lg leading-none"
                      >
                        {suitStyle[suit].symbol}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
        <p className="border-t border-white/[0.07] pt-4 text-xs leading-relaxed text-slate-400">
          Select a card to place it on the felt. Press Escape or click outside
          to cancel.
        </p>
      </DialogContent>
    </Dialog>
  );
}
