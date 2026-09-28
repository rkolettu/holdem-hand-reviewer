// Chips are data, never decoration: every chip on screen stands for a fixed
// amount, and every stack is proportional to the number it sits next to.

export const PER_STACK = 20;

// Denominations a chip can stand for, smallest first.
const DENOMINATIONS = [
  0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000,
  2000, 2500, 5000, 10000, 25000, 50000, 100000,
];

/**
 * The denomination for a set of amounts shown side by side. Prefers the
 * smallest chip that represents every amount within 2% (so 75 and 25 become
 * 30 and 10 chips, not 38 and 13), while keeping the largest within `maxChips`.
 */
export function chipUnit(amounts: number[], maxChips = 60) {
  const live = amounts.filter(
    (amount) => Number.isFinite(amount) && amount > 0,
  );
  if (!live.length) return 1;
  const largest = Math.max(...live);
  const fits = DENOMINATIONS.filter(
    (unit) => largest / unit <= maxChips + 1e-9,
  );
  if (!fits.length) return largest / maxChips;
  const exact = fits.find((unit) =>
    live.every((amount) => {
      const chips = Math.max(1, Math.round(amount / unit));
      return Math.abs(chips * unit - amount) <= amount * 0.02 + 1e-9;
    }),
  );
  return exact ?? fits[0];
}

/** Chips for an amount at a denomination. Any positive amount shows a chip. */
export function chipCount(amount: number, unit: number) {
  if (!Number.isFinite(amount) || amount <= 0 || !(unit > 0)) return 0;
  return Math.max(1, Math.round(amount / unit));
}

/** A share of the final pot as whole chips out of 100 (1 chip = 1%). */
export function hundredths(fraction: number) {
  if (!Number.isFinite(fraction)) return 0;
  return Math.min(100, Math.max(0, Math.round(fraction * 100)));
}

export function formatUnit(unit: number) {
  return Number.isInteger(unit)
    ? String(unit)
    : String(Number(unit.toFixed(2)));
}

/** Where chip `index` sits: which stack, and how high in it. */
export function stackSpot(index: number, perStack = PER_STACK) {
  return { stack: Math.floor(index / perStack), level: index % perStack };
}

// Deterministic per-chip variation: a little lateral slop and edge rotation,
// the way real chips never stack perfectly.
export function chipJitter(id: number) {
  const a = Math.sin(id * 12.9898) * 43758.5453;
  const b = Math.sin(id * 78.233) * 12543.1235;
  return {
    dx: (a - Math.floor(a) - 0.5) * 1.3,
    spin: (b - Math.floor(b)) * 4,
  };
}

// Chip artwork: 40 × 26 viewBox, face ellipse at y = 11, 4.5 units thick.
export const CHIP_RATIO = 26 / 40;
export const CHIP_THICKNESS = 4.5 / 40;
