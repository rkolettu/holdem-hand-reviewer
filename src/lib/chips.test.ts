// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { chipCount, chipUnit, hundredths, stackSpot } from './chips';

describe('chip scale', () => {
  it('picks the smallest denomination that fits the largest amount', () => {
    expect(chipUnit([60])).toBe(1);
    expect(chipUnit([100])).toBe(2);
    expect(chipUnit([250])).toBe(5);
    expect(chipUnit([3])).toBe(0.1);
    expect(chipUnit([0, Number.NaN])).toBe(1);
  });

  it('prefers a denomination that shows every amount exactly', () => {
    expect(chipUnit([75, 25])).toBe(2.5);
    expect(chipUnit([50, 25, 100])).toBe(2.5);
  });

  it('keeps stacks proportional to their amounts at one denomination', () => {
    const unit = chipUnit([75, 25]);
    expect(chipCount(75, unit) / chipCount(25, unit)).toBe(3);
    expect(chipCount(0, unit)).toBe(0);
    expect(chipCount(0.4, unit)).toBe(1);
    expect(chipCount(-5, unit)).toBe(0);
  });

  it('turns shares of the final pot into whole chips out of 100', () => {
    expect(hundredths(0.25)).toBe(25);
    expect(hundredths(0.314)).toBe(31);
    expect(hundredths(1.2)).toBe(100);
    expect(hundredths(Number.NaN)).toBe(0);
  });

  it('fills stacks of twenty from the bottom', () => {
    expect(stackSpot(0)).toEqual({ stack: 0, level: 0 });
    expect(stackSpot(19)).toEqual({ stack: 0, level: 19 });
    expect(stackSpot(25)).toEqual({ stack: 1, level: 5 });
  });
});
