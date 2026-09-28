export const pct = (value: number, digits = 1) =>
  `${(value * 100).toFixed(digits)}%`;

export const bb = (value: number, digits = 1) =>
  `${Number.isInteger(value) && digits <= 1 ? value : value.toFixed(digits)}`;

export const signed = (value: number, digits = 2) =>
  `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(digits)}`;

export const points = (value: number, digits = 1) =>
  `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value * 100).toFixed(digits)}`;
