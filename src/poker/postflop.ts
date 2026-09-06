import { type Card } from '../cards';
import type { OpponentRange } from './ranges';

export type ComboProfile = {
  primary: string;
  draws: string[];
  score: number;
};

const rankValue: Record<Card['rank'], number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

function key(card: Card) {
  return `${card.rank}-${card.suit}`;
}

function rankCounts(cards: Card[]) {
  const counts = new Map<number, number>();
  for (const card of cards) {
    const value = rankValue[card.rank];
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function straightValues(cards: Card[]) {
  const values = new Set(cards.map((card) => rankValue[card.rank]));
  if (values.has(14)) values.add(1);
  return values;
}

function hasStraight(cards: Card[]) {
  const values = straightValues(cards);
  for (let start = 1; start <= 10; start++) {
    let complete = true;
    for (let value = start; value < start + 5; value++) {
      if (!values.has(value)) {
        complete = false;
        break;
      }
    }
    if (complete) return true;
  }
  return false;
}

function hasStraightFlush(cards: Card[]) {
  const bySuit = new Map<Card['suit'], Card[]>();
  for (const card of cards) {
    const group = bySuit.get(card.suit) ?? [];
    group.push(card);
    bySuit.set(card.suit, group);
  }
  return [...bySuit.values()].some(
    (suitedCards) => suitedCards.length >= 5 && hasStraight(suitedCards),
  );
}

function flushSuit(cards: Card[]) {
  const counts = new Map<Card['suit'], number>();
  for (const card of cards)
    counts.set(card.suit, (counts.get(card.suit) ?? 0) + 1);
  return [...counts.entries()].find(([, count]) => count >= 5)?.[0] ?? null;
}

function straightDrawMissingRanks(holeCards: [Card, Card], board: Card[]) {
  const all = [...holeCards, ...board];
  const values = straightValues(all);
  const holeValues = new Set(holeCards.map((card) => rankValue[card.rank]));
  if (holeValues.has(14)) holeValues.add(1);
  const missing = new Set<number>();

  for (let start = 1; start <= 10; start++) {
    const window = Array.from({ length: 5 }, (_, index) => start + index);
    const present = window.filter((value) => values.has(value));
    if (present.length !== 4) continue;
    if (!present.some((value) => holeValues.has(value))) continue;
    const absent = window.find((value) => !values.has(value));
    if (absent !== undefined) missing.add(absent);
  }
  return missing;
}

function liveFlushDraw(holeCards: [Card, Card], board: Card[]) {
  if (board.length >= 5) return false;
  const all = [...holeCards, ...board];
  const counts = new Map<Card['suit'], number>();
  for (const card of all)
    counts.set(card.suit, (counts.get(card.suit) ?? 0) + 1);
  return [...counts.entries()].some(
    ([suit, count]) => count === 4 && holeCards.some((card) => card.suit === suit),
  );
}

export function profilePostflopCombo(
  holeCards: [Card, Card],
  board: Card[],
): ComboProfile {
  if (board.length < 3) {
    return { primary: 'Preflop', draws: [], score: 0 };
  }

  const all = [...holeCards, ...board];
  const counts = rankCounts(all);
  const countValues = [...counts.values()].sort((a, b) => b - a);
  const boardRanks = [...new Set(board.map((card) => rankValue[card.rank]))].sort(
    (a, b) => b - a,
  );
  const topBoardRank = boardRanks[0] ?? 0;
  const secondBoardRank = boardRanks[1] ?? -1;
  const holeRanks = holeCards.map((card) => rankValue[card.rank]);
  const pocketPair = holeRanks[0] === holeRanks[1];
  const pairRanks = [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([rank]) => rank)
    .sort((a, b) => b - a);
  const tripRanks = [...counts.entries()]
    .filter(([, count]) => count >= 3)
    .map(([rank]) => rank)
    .sort((a, b) => b - a);

  let primary = 'High card';
  let score = 100;

  if (hasStraightFlush(all)) {
    primary = 'Straight flush';
    score = 1000;
  } else if (countValues[0] === 4) {
    primary = 'Quads';
    score = 960;
  } else if (
    tripRanks.length >= 2 ||
    (tripRanks.length >= 1 && pairRanks.some((rank) => rank !== tripRanks[0]))
  ) {
    primary = 'Full house';
    score = 920;
  } else if (flushSuit(all)) {
    primary = 'Flush';
    score = 860;
  } else if (hasStraight(all)) {
    primary = 'Straight';
    score = 810;
  } else if (tripRanks.length) {
    const tripRank = tripRanks[0];
    const isSet =
      pocketPair && holeRanks[0] === tripRank && board.filter((card) => rankValue[card.rank] === tripRank).length === 1;
    primary = isSet ? 'Set' : 'Trips';
    score = isSet ? 750 : 725;
  } else if (pairRanks.length >= 2) {
    primary = 'Two pair';
    score = 650;
  } else if (pairRanks.length === 1) {
    if (pocketPair && holeRanks[0] > topBoardRank) {
      primary = 'Overpair';
      score = 590;
    } else if (holeRanks.includes(topBoardRank)) {
      primary = 'Top pair';
      score = 550;
    } else if (secondBoardRank > 0 && holeRanks.includes(secondBoardRank)) {
      primary = 'Middle pair';
      score = 500;
    } else if (pocketPair) {
      primary = 'Pocket pair';
      score = 470;
    } else if (holeRanks.some((rank) => boardRanks.includes(rank))) {
      primary = 'Pair';
      score = 440;
    } else {
      primary = 'Pair on board';
      score = 350;
    }
  }

  const draws: string[] = [];
  if (board.length < 5) {
    if (liveFlushDraw(holeCards, board)) {
      draws.push('Flush draw');
      score += 105;
    }

    const missingStraightRanks = straightDrawMissingRanks(holeCards, board);
    if (missingStraightRanks.size >= 2) {
      draws.push('Open-ended draw');
      score += 95;
    } else if (missingStraightRanks.size === 1) {
      draws.push('Gutshot');
      score += 50;
    }
  }

  const overcards = holeRanks.filter((rank) => rank > topBoardRank).length;
  if (primary === 'High card' && overcards === 2 && board.length < 5) {
    draws.push('Two overcards');
    score += 28;
  } else if (primary === 'High card' && overcards === 1 && board.length < 5) {
    draws.push('Overcard');
    score += 12;
  }

  // Kicker-quality tie breaker. It is intentionally small enough that made-hand
  // class and live draws dominate the ordering.
  const sortedHoleRanks = [...holeRanks].sort((a, b) => b - a);
  score += sortedHoleRanks[0] / 100 + sortedHoleRanks[1] / 10000;

  return { primary, draws, score };
}

function blocked(combo: [Card, Card], blockedCards: Card[]) {
  const blockedKeys = new Set(blockedCards.map(key));
  return combo.some((card) => blockedKeys.has(key(card)));
}

export function boardAwareContinuingCombinations(
  range: OpponentRange,
  foldEquity: number,
  board: Card[],
  blockedCards: Card[] = board,
) {
  if (!Number.isFinite(foldEquity) || foldEquity < 0 || foldEquity > 1)
    throw new Error('Fold equity must be between 0 and 1.');

  const eligible = range.combinations.filter((combo) => !blocked(combo, blockedCards));
  if (foldEquity >= 1 || eligible.length === 0) return [];

  const count = Math.max(
    1,
    Math.min(eligible.length, Math.round(eligible.length * (1 - foldEquity))),
  );

  if (board.length < 3) return eligible.slice(0, count);

  const originalOrder = new Map(range.combinations.map((combo, index) => [combo, index]));
  return eligible
    .map((combo) => ({
      combo,
      profile: profilePostflopCombo(combo, board),
      index: originalOrder.get(combo) ?? Number.MAX_SAFE_INTEGER,
    }))
    .sort((a, b) => b.profile.score - a.profile.score || a.index - b.index)
    .slice(0, count)
    .map(({ combo }) => combo);
}

export function summarizePostflopRange(
  combos: [Card, Card][],
  board: Card[],
) {
  if (board.length < 3) return [];
  const counts = new Map<string, number>();

  for (const combo of combos) {
    const profile = profilePostflopCombo(combo, board);
    let label = profile.primary;
    if (
      ['High card', 'Pair on board', 'Pocket pair', 'Pair', 'Middle pair'].includes(
        profile.primary,
      ) &&
      profile.draws.length
    ) {
      label = profile.draws[0];
    }
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
