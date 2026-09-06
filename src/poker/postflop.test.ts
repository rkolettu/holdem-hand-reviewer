// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { Card } from '../cards';
import type { OpponentRange } from './ranges';
import {
  boardAwareContinuingCombinations,
  profilePostflopCombo,
} from './postflop';

const c = (rank: Card['rank'], suit: Card['suit']): Card => ({ rank, suit });
const board: Card[] = [c('A', 'Hearts'), c('9', 'Hearts'), c('6', 'Clubs')];

describe('postflop range classification', () => {
  it('separates made hands, draws, and air on the actual board', () => {
    expect(
      profilePostflopCombo([c('A', 'Spades'), c('A', 'Diamonds')], board).primary,
    ).toBe('Set');
    expect(
      profilePostflopCombo([c('A', 'Clubs'), c('K', 'Clubs')], board).primary,
    ).toBe('Top pair');
    expect(
      profilePostflopCombo([c('9', 'Clubs'), c('8', 'Clubs')], board).primary,
    ).toBe('Middle pair');

    const openEnded = profilePostflopCombo(
      [c('8', 'Spades'), c('7', 'Spades')],
      board,
    );
    expect(openEnded.primary).toBe('High card');
    expect(openEnded.draws).toContain('Open-ended draw');

    const flushDraw = profilePostflopCombo(
      [c('K', 'Hearts'), c('Q', 'Hearts')],
      board,
    );
    expect(flushDraw.draws).toContain('Flush draw');

    const air = profilePostflopCombo(
      [c('3', 'Spades'), c('2', 'Diamonds')],
      board,
    );
    expect(air.primary).toBe('High card');
    expect(air.draws).toHaveLength(0);
  });

  it('keeps the strongest board-connected combos when villain folds', () => {
    const set: [Card, Card] = [c('A', 'Spades'), c('A', 'Diamonds')];
    const topPair: [Card, Card] = [c('A', 'Clubs'), c('K', 'Clubs')];
    const draw: [Card, Card] = [c('8', 'Spades'), c('7', 'Spades')];
    const air: [Card, Card] = [c('3', 'Spades'), c('2', 'Diamonds')];
    const fakeRange = {
      combinations: [air, draw, topPair, set],
    } as OpponentRange;

    const continuing = boardAwareContinuingCombinations(
      fakeRange,
      0.5,
      board,
      board,
    );

    expect(continuing).toHaveLength(2);
    expect(continuing).toContain(set);
    expect(continuing).toContain(topPair);
    expect(continuing).not.toContain(air);
  });

  it('removes known blockers before applying the continue percentage', () => {
    const blockedTopPair: [Card, Card] = [c('A', 'Spades'), c('K', 'Clubs')];
    const set: [Card, Card] = [c('A', 'Diamonds'), c('A', 'Clubs')];
    const draw: [Card, Card] = [c('8', 'Spades'), c('7', 'Spades')];
    const air: [Card, Card] = [c('3', 'Spades'), c('2', 'Diamonds')];
    const fakeRange = {
      combinations: [blockedTopPair, air, draw, set],
    } as OpponentRange;

    const continuing = boardAwareContinuingCombinations(
      fakeRange,
      0.5,
      board,
      [...board, c('A', 'Spades')],
    );

    expect(continuing).toHaveLength(2);
    expect(continuing).not.toContain(blockedTopPair);
    expect(continuing).toContain(set);
  });
});
