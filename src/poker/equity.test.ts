// @vitest-environment node
import { describe, it, expect } from 'vitest';
import type { Card } from '../cards';
import { calculateEquity } from './equity';
const card = (rank: Card['rank'], suit: Card['suit']): Card => ({ rank, suit });
const hero: [Card, Card] = [card('2', 'Hearts'), card('3', 'Diamonds')];
const villain: [Card, Card] = [card('4', 'Hearts'), card('5', 'Diamonds')];
const royal: Card[] = ['10', 'J', 'Q', 'K', 'A'].map((rank) =>
  card(rank as Card['rank'], 'Spades'),
);
describe('equity engine', () => {
  it('splits a royal-flush board exactly', () => {
    const result = calculateEquity({
      holeCards: hero,
      communityCards: royal,
      opponentCombos: [villain],
    });
    expect(result).toMatchObject({
      equity: 0.5,
      win: 0,
      tie: 1,
      loss: 0,
      method: 'exact',
      trials: 1,
      validCombos: 1,
    });
  });
  it('identifies an unbeatable hand and filters blockers', () => {
    const hole: [Card, Card] = [card('A', 'Spades'), card('K', 'Spades')];
    const result = calculateEquity({
      holeCards: hole,
      communityCards: [
        ...royal.slice(0, 3),
        card('2', 'Clubs'),
        card('3', 'Clubs'),
      ],
      opponentCombos: [villain, [hole[0], card('J', 'Clubs')]],
    });
    expect(result).toMatchObject({
      equity: 1,
      win: 1,
      tie: 0,
      loss: 0,
      validCombos: 1,
    });
  });
  it('enumerates every remaining turn river exactly', () => {
    const result = calculateEquity({
      holeCards: hero,
      communityCards: royal.slice(0, 4),
      opponentCombos: [villain],
    });
    expect(result.method).toBe('exact');
    expect(result.trials).toBe(44);
    expect(result.win + result.tie + result.loss).toBeCloseTo(1);
  });
  it('samples preflop deterministically and accounts for split pots', () => {
    const input = {
      holeCards: hero,
      communityCards: [],
      opponentCombos: [villain],
      samples: 2000,
    };
    const a = calculateEquity(input),
      b = calculateEquity(input);
    expect(a).toEqual(b);
    expect(a.method).toBe('estimated');
    expect(a.equity).toBeCloseTo(a.win + a.tie / 2);
    expect(a.trials).toBe(2000);
  });
  it('rejects duplicate cards, incomplete streets, and empty legal ranges', () => {
    expect(() =>
      calculateEquity({
        holeCards: [hero[0], hero[0]],
        communityCards: [],
        opponentCombos: [villain],
      }),
    ).toThrow();
    expect(() =>
      calculateEquity({
        holeCards: hero,
        communityCards: royal.slice(0, 2),
        opponentCombos: [villain],
      }),
    ).toThrow();
    expect(() =>
      calculateEquity({
        holeCards: hero,
        communityCards: [],
        opponentCombos: [[hero[0], villain[0]]],
      }),
    ).toThrow();
  });
});

it('enumerates all 990 flop runouts for each legal opponent', () => {
  const result = calculateEquity({
    holeCards: hero,
    communityCards: royal.slice(0, 3),
    opponentCombos: [villain],
  });
  expect(result.method).toBe('exact');
  expect(result.trials).toBe(990);
  expect(result.equity).toBeCloseTo(result.win + result.tie / 2);
});
it('correctly compares a wheel against a seven-high straight', () => {
  const result = calculateEquity({
    holeCards: [card('A', 'Spades'), card('2', 'Diamonds')],
    communityCards: [
      card('3', 'Spades'),
      card('4', 'Clubs'),
      card('5', 'Hearts'),
      card('K', 'Hearts'),
      card('Q', 'Clubs'),
    ],
    opponentCombos: [[card('6', 'Diamonds'), card('7', 'Hearts')]],
  });
  expect(result.loss).toBe(1);
  expect(result.equity).toBe(0);
});
it('uses the same full preflop simulation regardless of input ordering', () => {
  const hole: [Card, Card] = [card('A', 'Spades'), card('A', 'Hearts')];
  const opponents: [Card, Card][] = [
    [card('K', 'Clubs'), card('K', 'Diamonds')],
    [card('Q', 'Clubs'), card('Q', 'Diamonds')],
  ];
  const a = calculateEquity({
    holeCards: hole,
    communityCards: [],
    opponentCombos: opponents,
  });
  const b = calculateEquity({
    holeCards: [hole[1], hole[0]],
    communityCards: [],
    opponentCombos: [opponents[1], opponents[0]],
  });
  expect(a).toEqual(b);
  expect(a.trials).toBe(100000);
  expect(a.equity).toBeGreaterThan(0.7);
  expect(a.equity).toBeLessThan(0.9);
});
