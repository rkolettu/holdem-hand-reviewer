import { cardCode, evaluateCardCodes } from 'phe';
import { ranks, suits, type Card } from '../cards';
import { calculateEquity, type EquityInput } from './equity';

// Hero is "ahead" of the range at or above an even share of the pot.
export const AHEAD = 0.5;

export type NextCardOutcome = {
  card: Card;
  // Hero equity against the same range once this card is dealt (engine result).
  equity: number;
  // Chance this is the next card under the engine's weighting: every legal
  // opponent combination equally likely, every unseen card equally likely.
  probability: number;
};

export type OutsResult = {
  nextStreet: 'turn' | 'river';
  // Equity now, recovered as the probability-weighted average of the outcomes.
  equity: number;
  // Hero's share if the hand ended now, on the current board (win + tie / 2).
  showdownNow: number;
  // Hero's made hand currently beats at least half of the range.
  leading: boolean;
  outcomes: NextCardOutcome[];
  // Behind now: outs, the cards that put hero ahead of the range.
  // Leading now: danger cards, the cards that put hero behind it.
  counted: NextCardOutcome[];
  countedProbability: number;
};

const key = (card: Card) => `${card.rank}-${card.suit}`;
const suitCode = {
  Spades: 's',
  Hearts: 'h',
  Diamonds: 'd',
  Clubs: 'c',
} as const;
const code = (card: Card) =>
  cardCode(card.rank === '10' ? 'T' : card.rank, suitCode[card.suit]);

/**
 * Deals every unseen next card and reruns the existing equity engine on the
 * resulting board. Nothing here estimates or approximates equity: each outcome
 * is `calculateEquity` itself, so the weighted outcomes reproduce the current
 * street's equity exactly.
 */
export function nextCardOutcomes(input: EquityInput): OutsResult {
  const board = input.communityCards;
  if (board.length !== 3 && board.length !== 4)
    throw new Error('Outs need a flop or turn with cards still to come.');

  const known = new Set([...input.holeCards, ...board].map(key));
  if (known.size !== board.length + 2)
    throw new Error('Cards cannot be selected twice.');

  // The same legal combinations the engine keeps: unblocked and de-duplicated.
  const combos = new Map<string, [Card, Card]>();
  for (const combo of input.opponentCombos) {
    if (combo.some((card) => known.has(key(card)))) continue;
    combos.set(combo.map(key).sort().join('|'), combo);
  }
  if (!combos.size)
    throw new Error(
      'No opponent combinations remain after removing known cards.',
    );

  // Showdown on the current board, with the same evaluator the engine uses.
  const boardCodes = board.map(code);
  const heroValue = evaluateCardCodes([
    ...input.holeCards.map(code),
    ...boardCodes,
  ]);
  let wins = 0;
  let ties = 0;
  for (const combo of combos.values()) {
    const villainValue = evaluateCardCodes([...combo.map(code), ...boardCodes]);
    if (heroValue < villainValue) wins++;
    else if (heroValue === villainValue) ties++;
  }
  const showdownNow = (wins + ties / 2) / combos.size;
  const leading = showdownNow >= AHEAD;

  // Unseen cards left once a specific opponent combination is also removed.
  const perCombo = 52 - known.size - 2;
  const unseen = ranks
    .flatMap((rank) => suits.map((suit) => ({ rank, suit }) as Card))
    .filter((card) => !known.has(key(card)));

  const outcomes: NextCardOutcome[] = [];
  for (const card of unseen) {
    const cardKey = key(card);
    let live = 0;
    for (const combo of combos.values())
      if (key(combo[0]) !== cardKey && key(combo[1]) !== cardKey) live++;
    if (!live) continue;
    const result = calculateEquity({
      holeCards: input.holeCards,
      communityCards: [...board, card],
      opponentCombos: input.opponentCombos,
    });
    outcomes.push({
      card,
      equity: result.equity,
      probability: live / (combos.size * perCombo),
    });
  }

  const counted = outcomes.filter((outcome) =>
    leading ? outcome.equity < AHEAD : outcome.equity >= AHEAD,
  );

  return {
    nextStreet: board.length === 3 ? 'turn' : 'river',
    equity: outcomes.reduce(
      (sum, outcome) => sum + outcome.probability * outcome.equity,
      0,
    ),
    showdownNow,
    leading,
    outcomes,
    counted,
    countedProbability: counted.reduce(
      (sum, outcome) => sum + outcome.probability,
      0,
    ),
  };
}
