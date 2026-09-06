// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { generateOpponentRange } from './ranges';
import {
  bestAction,
  continuingCombinations,
  raiseMetrics,
  validateRaiseInputs,
} from './decision';

describe('raise decision math', () => {
  it('combines fold equity with the called branch EV', () => {
    const result = raiseMetrics(0.3, 75, 25, 75, 0.4);
    expect(result.villainCall).toBe(50);
    expect(result.finalPotIfCalled).toBe(200);
    expect(result.calledBranchEv).toBeCloseTo(-15);
    expect(result.ev).toBeCloseTo(21);
    expect(result.breakEvenFoldEquity).toBeCloseTo(1 / 6);
  });

  it('picks the highest EV action with fold anchored at zero', () => {
    expect(bestAction(-2, -1)).toBe('fold');
    expect(bestAction(3, 2)).toBe('call');
    expect(bestAction(3, 5)).toBe('raise');
  });

  it('tightens the selected range as fold equity rises', () => {
    const range = generateOpponentRange('BTN', 'Tight-Aggressive');
    const full = continuingCombinations(range, 0);
    const half = continuingCombinations(range, 0.5);
    expect(full).toHaveLength(range.combinations.length);
    expect(half.length).toBeLessThan(full.length);
    expect(half.length).toBeGreaterThan(0);
  });

  it('validates a legal minimum raise and fold assumption', () => {
    expect(validateRaiseInputs(10, '100', '20', '35').ready).toBe(true);
    expect(validateRaiseInputs(10, '100', '19.5', '35').invalid).toBe(true);
    expect(validateRaiseInputs(10, '100', '20', '101').invalid).toBe(true);
  });
});
