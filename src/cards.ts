export const ranks = [
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A',
] as const;
export const suits = ['Spades', 'Hearts', 'Diamonds', 'Clubs'] as const;
export type Card = {
  rank: (typeof ranks)[number];
  suit: (typeof suits)[number];
};
export type ActiveSlot = {
  group: 'hole' | 'community';
  index: number;
  label: string;
};
export const suitStyle = {
  Spades: {
    symbol: '♠',
    cardColor: 'text-slate-800',
    labelColor: 'text-slate-300',
  },
  Hearts: {
    symbol: '♥',
    cardColor: 'text-red-600',
    labelColor: 'text-red-400',
  },
  Diamonds: {
    symbol: '♦',
    cardColor: 'text-red-600',
    labelColor: 'text-red-400',
  },
  Clubs: {
    symbol: '♣',
    cardColor: 'text-slate-800',
    labelColor: 'text-slate-300',
  },
} as const;
export function sameCard(a: Card | null, b: Card | null): boolean {
  return a !== null && b !== null && a.rank === b.rank && a.suit === b.suit;
}
