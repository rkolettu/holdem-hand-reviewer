# The Felt — Texas Hold’em Decision Lab

A browser-based poker study tool for reviewing postflop decisions and practicing fold / call / raise spots with explicit expected-value assumptions.

Built with React 19, Vite 8, TypeScript, Tailwind CSS 4, and the browser-compatible [PHE hand evaluator](https://github.com/thlorenz/phe).

## What it does

### Hand Review

- Select hero hole cards and a complete street (preflop, flop, turn, or river).
- Model an opponent using position-adjusted starting ranges for four playstyles.
- Calculate showdown equity, pot odds, and call EV.
- Enter a raise-to size and an assumed fold-to-raise percentage.
- Recalculate equity against the opponent’s stronger continuing range.
- Compare **Fold EV = 0**, **Call EV**, and **Raise EV** side by side.
- Show the break-even fold percentage for the entered raise size.
- Quick sizing presets include minimum raise, 3× the faced bet, and a pot-sized raise.

### Practice Mode

Practice mode generates a random postflop spot with:

- two hole cards,
- a flop / turn / river board,
- opponent position and playstyle,
- pot, bet-to-call, and stack size,
- one raise-to option,
- an explicit fold-to-raise assumption.

Choose **Fold**, **Call**, or **Raise** before seeing the answer. The app then reveals the EV of all three actions, the best modeled action, your score, and the raise break-even point.

## Opponent model

The ranges are explicit assumptions, not solved GTO strategies or measured population statistics.

Base opening widths:

- Nit: 5%
- Tight-Aggressive: 15%
- Loose-Aggressive: 30%
- Calling Station: 40%

Position multipliers adjust those widths. Hand classes are ordered strongest to weakest and expanded into actual combinations. Known hero and board cards remove blocked combinations before evaluation.

For raise analysis, the entered fold-to-raise percentage is treated as an assumption. If villain folds `F%`, the model assumes they fold the weakest `F%` of the selected range and continue with the strongest remaining combinations. Hero equity is recalculated against that continue range.

Practice mode uses simple archetype-based fold-to-raise assumptions with a small raise-size adjustment. Those are study assumptions, not solver outputs.

## Equity engine

PHE evaluates the best five-card hand from seven cards.

- Flop, turn, and river equity are enumerated exactly over every legal opponent / runout combination.
- Preflop uses 100,000 reproducible seeded samples.
- Equity is `win + tie / 2` for a single opponent.
- Calculations run in cancellable Web Workers so stale inputs do not overwrite newer results.

## Decision math

**Pot Size includes the opponent’s current bet and excludes hero’s prospective action.**

### Call

- Pot odds: `call / (pot + call)`
- Call EV: `equity × (pot + call) − call`
- Fold EV: `0`

### Raise

Let:

- `R` = hero’s total raise-to amount from the current decision point,
- `C` = amount hero would need to call,
- `F` = assumed probability villain folds to the raise,
- `E` = hero equity against villain’s continuing range.

If villain calls, they add `R − C` more chips. The final pot is:

`pot + R + (R − C)`

The called branch EV is:

`E × finalPot − R`

Raise EV is:

`F × pot + (1 − F) × calledBranchEV`

The app also solves the fold percentage required for that specific raise size to break even.

The raise model assumes no re-raise, no future betting, no rake, no side pots, and full showdown equity realization. It is sensitivity analysis, not a GTO recommendation.

## Run locally

Requires Node.js 22.13 or later.

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm start
```

## Source map

- `src/App.tsx`: hand-review workspace and raise inputs.
- `src/components/AnalysisPanel.tsx`: fold / call / raise EV comparison.
- `src/components/PracticeMode.tsx`: randomized decision game and scoring.
- `src/poker/equity.ts`, `equity.worker.ts`, `useEquity.ts`: showdown equity engine.
- `src/poker/ranges.ts`: starting-range generation.
- `src/poker/decision.ts`: continue-range construction, raise EV, and action comparison.
- `src/poker/practice.ts`: randomized practice scenarios.
- `src/poker/metrics.ts`: call pot odds and EV.

The app is client-rendered and requires no API key or paid service.
