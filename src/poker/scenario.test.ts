// @vitest-environment node
import { it, expect } from 'vitest';
import { validateScenario } from './scenario';
import type { Card } from '../cards';
const c: Card = { rank: 'A', suit: 'Spades' },
  d: Card = { rank: 'K', suit: 'Spades' };
it('requires both cards and nonempty finite amounts', () => {
  expect(validateScenario([c, null], [], '10', '5', '').ready).toBe(false);
  expect(validateScenario([c, d], [], '', '5', '').ready).toBe(false);
  expect(validateScenario([c, d], [], '10', '-5', '').invalid).toBe(true);
  expect(validateScenario([c, d], [], 'Infinity', '5', '').invalid).toBe(true);
  expect(validateScenario([c, d], [], '10', '0', '').ready).toBe(true);
  expect(validateScenario([c, d], [], '0', '0', '').ready).toBe(false);
  expect(validateScenario([c, d], [], '10', '5', '4').ready).toBe(false);
});
it('rejects partial flops or skipped streets', () => {
  expect(
    validateScenario([c, d], [c, null, null, null, null], '10', '5', '').ready,
  ).toBe(false);
  expect(
    validateScenario([c, d], [c, c, null, c, null], '10', '5', '').ready,
  ).toBe(false);
  expect(
    validateScenario([c, d], [c, c, c, null, null], '10', '5', '').ready,
  ).toBe(true);
});
