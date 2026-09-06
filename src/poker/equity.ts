import { cardCode, evaluateCardCodes } from 'phe';
import { type Card, ranks, suits } from '../cards';
export type EquityInput = {
  holeCards: [Card, Card];
  communityCards: Card[];
  opponentCombos: [Card, Card][];
  samples?: number;
};
export type EquityResult = {
  equity: number;
  win: number;
  tie: number;
  loss: number;
  method: 'exact' | 'estimated';
  trials: number;
  validCombos: number;
  marginOfError?: number;
};
const suitCode = {
  Spades: 's',
  Hearts: 'h',
  Diamonds: 'd',
  Clubs: 'c',
} as const;
function encode(card: Card): number {
  if (!card || !ranks.includes(card.rank) || !suits.includes(card.suit))
    throw new Error('Invalid card.');
  return cardCode(card.rank === '10' ? 'T' : card.rank, suitCode[card.suit]);
}
const fullDeck = ranks.flatMap((rank) =>
  suits.map((suit) => encode({ rank, suit })),
);
function seededRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function calculateEquity(input: EquityInput): EquityResult {
  if (
    input.holeCards.length !== 2 ||
    ![0, 3, 4, 5].includes(input.communityCards.length)
  )
    throw new Error('Select two hole cards and a complete street.');
  const hero = input.holeCards.map(encode).sort((a, b) => a - b);
  const board = input.communityCards.map(encode).sort((a, b) => a - b);
  const known = new Set([...hero, ...board]);
  if (known.size !== hero.length + board.length)
    throw new Error('Cards cannot be selected twice.');
  const unique = new Map<string, number[]>();
  for (const pair of input.opponentCombos) {
    if (pair.length !== 2)
      throw new Error('Opponent combinations need two cards.');
    const codes = pair.map(encode).sort((a, b) => a - b);
    if (codes[0] === codes[1]) throw new Error('Invalid opponent combination.');
    if (codes.some((c) => known.has(c))) continue;
    unique.set(codes.join(','), codes);
  }
  const opponents = [...unique.values()].sort(
    (a, b) => a[0] - b[0] || a[1] - b[1],
  );
  if (!opponents.length)
    throw new Error(
      'No opponent combinations remain after removing known cards.',
    );
  const remaining = fullDeck.filter((c) => !known.has(c));
  const missing = 5 - board.length;
  let wins = 0,
    ties = 0,
    trials = 0;
  const heroSeven = [...hero, ...board, 0, 0, 0, 0, 0].slice(0, 7);
  const villainSeven = [0, 0, ...board, 0, 0, 0, 0, 0].slice(0, 7);
  function record(opponent: number[], runout: number[]) {
    villainSeven[0] = opponent[0];
    villainSeven[1] = opponent[1];
    for (let i = 0; i < missing; i++) {
      heroSeven[2 + board.length + i] = runout[i];
      villainSeven[2 + board.length + i] = runout[i];
    }
    const heroRank = evaluateCardCodes(heroSeven),
      villainRank = evaluateCardCodes(villainSeven);
    if (heroRank < villainRank) wins++;
    else if (heroRank === villainRank) ties++;
    trials++;
  }
  if (missing <= 2) {
    // Every legal combo has the same number of possible runouts. Uniform exact enumeration.
    for (const opponent of opponents) {
      const deck = remaining.filter((c) => !opponent.includes(c));
      if (missing === 0) record(opponent, []);
      else if (missing === 1) for (const c of deck) record(opponent, [c]);
      else
        for (let i = 0; i < deck.length; i++)
          for (let j = i + 1; j < deck.length; j++)
            record(opponent, [deck[i], deck[j]]);
    }
  } else {
    const samples = input.samples ?? 100000;
    if (!Number.isInteger(samples) || samples < 1 || samples > 1000000)
      throw new Error('Invalid sample count.');
    // Canonical input seed makes repeated results stable without using a random global.
    const seedText = JSON.stringify([hero, board, opponents]);
    let seed = 2166136261;
    for (let i = 0; i < seedText.length; i++)
      seed = Math.imul(seed ^ seedText.charCodeAt(i), 16777619);
    const random = seededRandom(seed);
    for (let n = 0; n < samples; n++) {
      const opponent = opponents[Math.floor(random() * opponents.length)];
      const runout: number[] = [];
      while (runout.length < missing) {
        const c = remaining[Math.floor(random() * remaining.length)];
        if (!opponent.includes(c) && !runout.includes(c)) runout.push(c);
      }
      record(opponent, runout);
    }
  }
  const win = wins / trials,
    tie = ties / trials,
    equity = win + tie / 2;
  // Conservative 95% bound for a [0,1] payoff (max variance 1/4).
  return {
    win,
    tie,
    loss: (trials - wins - ties) / trials,
    equity,
    method: missing <= 2 ? 'exact' : 'estimated',
    trials,
    validCombos: opponents.length,
    ...(missing > 2 ? { marginOfError: (1.96 * 0.5) / Math.sqrt(trials) } : {}),
  };
}
