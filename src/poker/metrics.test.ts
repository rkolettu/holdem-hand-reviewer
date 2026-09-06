// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { financialMetrics } from './metrics';
describe('call mathematics', () => {
  it.each([
    [0.2, -5, 'fold'],
    [0.25, 0, 'neutral'],
    [0.3, 5, 'call'],
  ] as const)(
    'keeps pot odds and EV consistent at equity %s',
    (equity, ev, verdict) => {
      const result = financialMetrics(equity, 75, 25);
      expect(result.potOdds).toBe(0.25);
      expect(result.ev).toBeCloseTo(ev);
      expect(result.verdict).toBe(verdict);
    },
  );
  it('uses tie-adjusted equity and treats a free action as a check', () => {
    expect(financialMetrics(0.5, 60, 20).ev).toBe(20);
    expect(financialMetrics(0, 60, 0).verdict).toBe('check');
  });
  it.each([
    [NaN, 10, 2],
    [1.1, 10, 2],
    [0.5, -1, 2],
    [0.5, 10, -2],
    [0.5, 0, 0],
    [0.5, Infinity, 2],
  ])('rejects invalid figures %s/%s/%s', (e, p, c) => {
    expect(() => financialMetrics(e, p, c)).toThrow();
  });
});
