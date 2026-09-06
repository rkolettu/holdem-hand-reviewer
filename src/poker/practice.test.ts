// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { generatePracticeScenario } from './practice';

function seededRandom(seed = 1) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

describe('practice scenario generation', () => {
  it('creates legal postflop spots without duplicate cards', () => {
    const random = seededRandom(42);
    for (let index = 0; index < 30; index++) {
      const spot = generatePracticeScenario(random);
      const cards = [...spot.holeCards, ...spot.board];
      const unique = new Set(cards.map((card) => `${card.rank}-${card.suit}`));
      expect(unique.size).toBe(cards.length);
      expect([3, 4, 5]).toContain(spot.board.length);
      expect(spot.call).toBeGreaterThan(0);
      expect(spot.raiseTo).toBeGreaterThanOrEqual(spot.call * 2);
      expect(spot.raiseTo).toBeLessThanOrEqual(spot.stack);
      expect(spot.foldEquity).toBeGreaterThanOrEqual(0);
      expect(spot.foldEquity).toBeLessThanOrEqual(1);
    }
  });
});
