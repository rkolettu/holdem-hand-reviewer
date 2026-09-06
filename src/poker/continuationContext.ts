import type { Card } from '../cards';
import type { OpponentRange } from './ranges';
import { boardAwareContinuingCombinations } from './postflop';

const continuationMetadata = new WeakMap<
  [Card, Card][],
  { range: OpponentRange; foldEquity: number }
>();

export function registerContinuationSelection(
  combos: [Card, Card][],
  range: OpponentRange,
  foldEquity: number,
) {
  continuationMetadata.set(combos, { range, foldEquity });
  return combos;
}

export function resolveContinuationSelection(
  combos: [Card, Card][],
  board: Card[],
  blockedCards: Card[],
) {
  const metadata = continuationMetadata.get(combos);
  if (!metadata) return combos;
  return boardAwareContinuingCombinations(
    metadata.range,
    metadata.foldEquity,
    board,
    blockedCards,
  );
}
