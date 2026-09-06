import { ranks, suits, type Card } from '../cards';
import {
  PLAYSTYLES,
  POSITIONS,
  type Playstyle,
  type Position,
} from './ranges';

export type PracticeScenario = {
  holeCards: [Card, Card];
  board: Card[];
  position: Position;
  playstyle: Playstyle;
  pot: number;
  call: number;
  stack: number;
  raiseTo: number;
  foldEquity: number;
};

const BASE_FOLD_TO_RAISE: Record<Playstyle, number> = {
  Nit: 0.46,
  'Tight-Aggressive': 0.34,
  'Loose-Aggressive': 0.27,
  'Calling Station': 0.16,
};

const roundHalf = (value: number) => Math.round(value * 2) / 2;
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)]!;
}

function shuffledDeck(random: () => number): Card[] {
  const deck = ranks.flatMap((rank) => suits.map((suit) => ({ rank, suit })));
  for (let index = deck.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [deck[index], deck[swap]] = [deck[swap], deck[index]];
  }
  return deck;
}

export function generatePracticeScenario(
  random: () => number = Math.random,
): PracticeScenario {
  const deck = shuffledDeck(random);
  const boardCount = pick([3, 4, 5] as const, random);
  const holeCards = [deck[0], deck[1]] as [Card, Card];
  const board = deck.slice(2, 2 + boardCount);
  const position = pick(POSITIONS, random);
  const playstyle = pick(PLAYSTYLES, random);

  const potBeforeBet = pick([6, 8, 10, 12, 16, 20, 24, 30] as const, random);
  const betFraction = pick([0.33, 0.5, 0.67, 0.75, 1] as const, random);
  const call = Math.max(1, roundHalf(potBeforeBet * betFraction));
  const pot = roundHalf(potBeforeBet + call);
  const raiseMultiple = pick([2, 2.5, 3] as const, random);
  const raiseTo = roundHalf(call * raiseMultiple);
  const stack = Math.max(
    raiseTo + 20,
    pick([60, 80, 100, 120] as const, random),
  );

  const foldEquity = clamp(
    BASE_FOLD_TO_RAISE[playstyle] + (raiseMultiple - 2) * 0.08,
    0.05,
    0.7,
  );

  return {
    holeCards,
    board,
    position,
    playstyle,
    pot,
    call,
    stack,
    raiseTo,
    foldEquity,
  };
}

export function streetName(board: Card[]) {
  return board.length === 3 ? 'Flop' : board.length === 4 ? 'Turn' : 'River';
}
