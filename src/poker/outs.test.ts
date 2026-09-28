// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { Card } from '../cards';
import { calculateEquity } from './equity';
import { nextCardOutcomes } from './outs';
import { generateOpponentRange } from './ranges';

const c = (rank: Card['rank'], suit: Card['suit']): Card => ({ rank, suit });

describe('next-card outcomes', () => {
  it('reproduces the engine equity exactly from the flop', () => {
    const range = generateOpponentRange('CO', 'Tight-Aggressive');
    const input = {
      holeCards: [c('K', 'Spades'), c('Q', 'Spades')] as [Card, Card],
      communityCards: [c('A', 'Diamonds'), c('7', 'Spades'), c('2', 'Spades')],
      opponentCombos: range.combinations,
    };
    const outs = nextCardOutcomes(input);
    const direct = calculateEquity(input);

    expect(outs.nextStreet).toBe('turn');
    expect(outs.outcomes).toHaveLength(47);
    expect(
      outs.outcomes.reduce((sum, outcome) => sum + outcome.probability, 0),
    ).toBeCloseTo(1, 12);
    expect(outs.equity).toBeCloseTo(direct.equity, 12);
  });

  it('reproduces the engine equity exactly from the turn', () => {
    const range = generateOpponentRange('BTN', 'Loose-Aggressive');
    const input = {
      holeCards: [c('9', 'Hearts'), c('8', 'Hearts')] as [Card, Card],
      communityCards: [
        c('10', 'Hearts'),
        c('7', 'Clubs'),
        c('2', 'Hearts'),
        c('K', 'Spades'),
      ],
      opponentCombos: range.combinations,
    };
    const outs = nextCardOutcomes(input);
    expect(outs.nextStreet).toBe('river');
    expect(outs.outcomes).toHaveLength(46);
    expect(outs.equity).toBeCloseTo(calculateEquity(input).equity, 12);
  });

  it('counts only the flush cards as outs for a draw behind top pair', () => {
    // Villain holds exactly top pair; nine spades give hero the best hand.
    const outs = nextCardOutcomes({
      holeCards: [c('K', 'Spades'), c('Q', 'Spades')],
      communityCards: [c('A', 'Diamonds'), c('7', 'Spades'), c('2', 'Spades')],
      opponentCombos: [[c('A', 'Hearts'), c('J', 'Clubs')]],
    });
    expect(outs.showdownNow).toBe(0);
    expect(outs.leading).toBe(false);
    // Pairing a king or queen still loses to top pair; only spades are outs.
    expect(outs.counted).toHaveLength(9);
    expect(outs.counted.every((o) => o.card.suit === 'Spades')).toBe(true);
    for (const outcome of outs.counted) {
      expect(outcome.equity).toBeGreaterThanOrEqual(0.5);
    }
    // One legal opponent hand: each unseen card is equally likely.
    expect(outs.outcomes[0].probability).toBeCloseTo(1 / 45, 12);
    expect(outs.countedProbability).toBeCloseTo(outs.counted.length / 45, 12);
  });

  it('counts the danger cards when the made hand is leading', () => {
    const outs = nextCardOutcomes({
      holeCards: [c('A', 'Hearts'), c('J', 'Clubs')],
      communityCards: [c('A', 'Diamonds'), c('7', 'Spades'), c('2', 'Spades')],
      opponentCombos: [[c('K', 'Spades'), c('Q', 'Spades')]],
    });
    expect(outs.showdownNow).toBe(1);
    expect(outs.leading).toBe(true);
    // The nine spades are the only danger cards for top pair here.
    expect(outs.counted).toHaveLength(9);
    expect(outs.counted.every((o) => o.card.suit === 'Spades')).toBe(true);
    expect(outs.counted.every((o) => o.equity < 0.5)).toBe(true);
  });

  it('rejects streets without a next card', () => {
    const hole: [Card, Card] = [c('A', 'Spades'), c('K', 'Spades')];
    expect(() =>
      nextCardOutcomes({
        holeCards: hole,
        communityCards: [],
        opponentCombos: [[c('2', 'Clubs'), c('3', 'Clubs')]],
      }),
    ).toThrow();
    expect(() =>
      nextCardOutcomes({
        holeCards: hole,
        communityCards: [
          c('2', 'Hearts'),
          c('5', 'Hearts'),
          c('9', 'Clubs'),
          c('J', 'Diamonds'),
          c('Q', 'Clubs'),
        ],
        opponentCombos: [[c('2', 'Clubs'), c('3', 'Clubs')]],
      }),
    ).toThrow();
  });
});
