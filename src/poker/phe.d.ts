declare module 'phe' {
  export function cardCode(rank: string, suit: string): number;
  export function evaluateCardCodes(cards: number[]): number;
}
