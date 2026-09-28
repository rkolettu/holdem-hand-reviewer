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
export const suitInfo = {
  Spades: { symbol: '♠', tone: 'black', key: 's' },
  Hearts: { symbol: '♥', tone: 'red', key: 'h' },
  Diamonds: { symbol: '♦', tone: 'red', key: 'd' },
  Clubs: { symbol: '♣', tone: 'black', key: 'c' },
} as const;
export function sameCard(a: Card | null, b: Card | null): boolean {
  return a !== null && b !== null && a.rank === b.rank && a.suit === b.suit;
}
export function cardName(card: Card) {
  return `${card.rank} of ${card.suit}`;
}
export function cardShort(card: Card) {
  return `${card.rank}${suitInfo[card.suit].symbol}`;
}
export function cardKey(card: Card) {
  return `${card.rank}-${card.suit}`;
}
