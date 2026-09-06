import type { Card } from '../cards';
import type { OpponentRange } from './ranges';
import { boardAwareContinuingCombinations } from './postflop';

export type DecisionAction = 'fold' | 'call' | 'raise';

export type RaiseValidation = {
  ready: boolean;
  invalid: boolean;
  message: string;
  raiseTo: number;
  foldEquity: number;
};

export function validateRaiseInputs(
  call: number,
  stackText: string,
  raiseText: string,
  foldPercentText: string,
): RaiseValidation {
  const raiseTo = Number(raiseText);
  const foldPercent = Number(foldPercentText);
  const stack = Number(stackText);

  const fail = (message: string, invalid = false): RaiseValidation => ({
    ready: false,
    invalid,
    message,
    raiseTo,
    foldEquity: Number.isFinite(foldPercent) ? foldPercent / 100 : 0,
  });

  if (call <= 0) return fail('A raise comparison appears when there is a bet to face.');
  if (raiseText.trim() === '') return fail('Enter a raise-to size to compare fold, call, and raise.');
  if (!Number.isFinite(raiseTo) || raiseTo <= 0)
    return fail('Raise-to size must be a finite positive number.', true);
  if (raiseTo < call * 2 - 1e-9)
    return fail(`Minimum raise-to size in this model is ${(call * 2).toFixed(1)} BB.`, true);
  if (stackText.trim() !== '' && (!Number.isFinite(stack) || stack < 0))
    return fail('Stack size must be a finite nonnegative number.', true);
  if (stackText.trim() !== '' && raiseTo > stack)
    return fail('Raise-to size cannot exceed your stack.', true);
  if (foldPercentText.trim() === '')
    return fail('Enter an assumed fold-to-raise percentage.', true);
  if (!Number.isFinite(foldPercent) || foldPercent < 0 || foldPercent > 100)
    return fail('Fold-to-raise must be between 0% and 100%.', true);

  return {
    ready: true,
    invalid: false,
    message: '',
    raiseTo,
    foldEquity: foldPercent / 100,
  };
}

export function continuingCombinations(
  range: OpponentRange,
  foldEquity: number,
  board: Card[] = [],
  blockedCards: Card[] = board,
) {
  return boardAwareContinuingCombinations(
    range,
    foldEquity,
    board,
    blockedCards,
  );
}

export function raiseMetrics(
  equityWhenCalled: number,
  pot: number,
  call: number,
  raiseTo: number,
  foldEquity: number,
) {
  if (
    ![equityWhenCalled, pot, call, raiseTo, foldEquity].every(Number.isFinite) ||
    equityWhenCalled < 0 ||
    equityWhenCalled > 1 ||
    pot < 0 ||
    call < 0 ||
    raiseTo <= call ||
    foldEquity < 0 ||
    foldEquity > 1
  )
    throw new Error('Enter valid raise-analysis inputs.');

  const villainCall = raiseTo - call;
  const finalPotIfCalled = pot + raiseTo + villainCall;
  const calledBranchEv = equityWhenCalled * finalPotIfCalled - raiseTo;
  const ev = foldEquity * pot + (1 - foldEquity) * calledBranchEv;

  const breakEvenFoldEquity =
    calledBranchEv >= 0
      ? 0
      : Math.min(1, Math.max(0, -calledBranchEv / (pot - calledBranchEv)));

  return {
    ev,
    villainCall,
    finalPotIfCalled,
    calledBranchEv,
    breakEvenFoldEquity,
  };
}

export function bestAction(
  callEv: number,
  raiseEv: number | null,
): DecisionAction {
  const candidates: Array<[DecisionAction, number]> = [
    ['fold', 0],
    ['call', callEv],
  ];
  if (raiseEv !== null && Number.isFinite(raiseEv))
    candidates.push(['raise', raiseEv]);

  return candidates.reduce((best, current) =>
    current[1] > best[1] ? current : best,
  )[0];
}
