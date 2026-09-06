export function financialMetrics(equity: number, pot: number, call: number) {
  if (
    ![equity, pot, call].every(Number.isFinite) ||
    equity < 0 ||
    equity > 1 ||
    pot < 0 ||
    call < 0 ||
    pot + call <= 0 ||
    !Number.isFinite(pot + call)
  )
    throw new Error('Enter valid equity, pot and call amounts.');
  const potOdds = call / (pot + call);
  // Pot includes the opponent's bet, but not our call. Equity includes half ties.
  // Subtract the call once from our expected share of the final pot.
  const ev = equity * (pot + call) - call;
  const verdict: 'call' | 'fold' | 'neutral' | 'check' =
    call === 0
      ? 'check'
      : Math.abs(equity - potOdds) < 1e-12
        ? 'neutral'
        : equity > potOdds
          ? 'call'
          : 'fold';
  return { potOdds, ev, verdict };
}
