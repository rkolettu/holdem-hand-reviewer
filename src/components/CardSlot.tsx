import type { MouseEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Card, suitStyle } from '../cards';

export function CardSlot({
  label,
  card,
  onOpen,
  onClear,
}: {
  label: string;
  card: Card | null;
  onOpen: (event: MouseEvent<HTMLButtonElement>) => void;
  onClear: () => void;
}) {
  return (
    <div className="relative aspect-[5/7] w-full">
      <Button
        type="button"
        variant="ghost"
        aria-haspopup="dialog"
        aria-label={
          card
            ? `Change ${label}: ${card.rank} of ${card.suit}`
            : `Select ${label}`
        }
        onClick={onOpen}
        className={`group relative flex h-full w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border p-0 shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-[#d6bc79] focus-visible:ring-offset-2 focus-visible:ring-offset-[#103e35] sm:rounded-xl ${card ? `border-white/80 bg-slate-100 hover:bg-white ${suitStyle[card.suit].cardColor}` : 'border-dashed border-white/35 bg-white/[0.035] text-emerald-100/30 hover:border-[#d6bc79]/70 hover:bg-white/[0.08] hover:text-[#d6bc79]'}`}
      >
        {card ? (
          <span aria-hidden="true" className="relative block h-full w-full">
            <span className="absolute left-1.5 top-1.5 text-sm font-bold leading-none sm:left-3 sm:top-3 sm:text-2xl">
              {card.rank}
            </span>
            <span className="absolute inset-0 flex items-center justify-center font-serif text-xl leading-none sm:text-4xl">
              {suitStyle[card.suit].symbol}
            </span>
            <span className="absolute bottom-1.5 right-1.5 rotate-180 text-sm font-bold leading-none sm:bottom-3 sm:right-3 sm:text-2xl">
              {card.rank}
            </span>
          </span>
        ) : (
          <Plus
            aria-hidden="true"
            className="size-4 opacity-60 sm:size-5"
            strokeWidth={1}
          />
        )}
      </Button>
      {card && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Clear ${label}`}
          onClick={onClear}
          className="absolute -right-1.5 -top-1.5 z-10 size-7 cursor-pointer rounded-full border border-slate-600 bg-slate-900 text-slate-300 shadow-md hover:bg-slate-700 hover:text-white focus-visible:ring-[#d6bc79]"
        >
          <X aria-hidden="true" className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
