// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { generateOpponentRange, PLAYSTYLES, POSITIONS } from './ranges';

describe('assumed opponent ranges', () => {
  it('uses complete unbiased hand classes and reports their actual combination frequency', () => {
    for (const style of PLAYSTYLES)
      for (const position of POSITIONS) {
        const range = generateOpponentRange(position, style);
        const keys = range.combinations.map((pair) =>
          pair
            .map((c) => c.rank + c.suit)
            .sort()
            .join('/'),
        );
        expect(new Set(keys).size).toBe(keys.length);
        expect(range.percentage).toBeCloseTo((keys.length / 1326) * 100, 10);
        expect(Math.abs(range.percentage - range.targetPercent)).toBeLessThan(
          0.5,
        );
        expect(range.handClasses).toContain('AA');
        for (const pair of range.combinations)
          expect(pair[0]).not.toEqual(pair[1]);
        expect(
          range.combinations.filter((pair) =>
            pair.every((c) => c.rank === 'A'),
          ),
        ).toHaveLength(6);
      }
  });
  it('widens by position and by playstyle with repeatable output', () => {
    const utg = generateOpponentRange('UTG', 'Tight-Aggressive');
    const btn = generateOpponentRange('BTN', 'Tight-Aggressive');
    expect(btn.percentage).toBeGreaterThan(utg.percentage);
    expect(btn).toEqual(generateOpponentRange('BTN', 'Tight-Aggressive'));
    const widths = [
      'Nit',
      'Tight-Aggressive',
      'Loose-Aggressive',
      'Calling Station',
    ].map(
      (style) =>
        generateOpponentRange('MP', style as (typeof PLAYSTYLES)[number])
          .percentage,
    );
    expect(widths).toEqual([...widths].sort((a, b) => a - b));
    expect(generateOpponentRange('MP', 'Nit').basePercent).toBe(5);
  });
});
