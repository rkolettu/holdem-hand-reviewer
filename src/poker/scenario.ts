import type { Card } from '../cards';
export function validateScenario(
  holeCards: (Card | null)[],
  board: (Card | null)[],
  potText: string,
  callText: string,
  stackText: string,
) {
  const pot = Number(potText),
    call = Number(callText),
    stack = Number(stackText);
  const fail = (message: string, invalid = false) => ({
    ready: false,
    message,
    invalid,
    pot,
    call,
  });
  for (const [label, value] of [
    ['Pot size', potText],
    ['Call amount', callText],
    ['Stack size', stackText],
  ]) {
    if (
      value.trim() !== '' &&
      (!Number.isFinite(Number(value)) || Number(value) < 0)
    )
      return fail(`${label} must be a finite, nonnegative number.`, true);
  }
  if (holeCards.filter(Boolean).length !== 2)
    return fail('Select both hole cards to start the analysis.');
  const count = board.filter(Boolean).length;
  if (
    ![0, 3, 4, 5].includes(count) ||
    board.some(
      (card, index) =>
        card !== null &&
        board.slice(0, index).some((previous) => previous === null),
    )
  )
    return fail('Complete the flop, then add the turn and river in order.');
  if (potText.trim() === '' || callText.trim() === '')
    return fail('Enter pot size and call amount to analyze this hand.');
  if (!Number.isFinite(pot + call) || pot + call <= 0)
    return fail(
      'The pot plus call amount must be greater than zero and finite.',
      true,
    );
  if (stackText.trim() !== '' && call > stack)
    return fail('Call amount cannot exceed your stack size.', true);
  return { ready: true, message: '', invalid: false, pot, call };
}
