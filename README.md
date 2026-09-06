# The Felt — Texas Hold’em Hand Reviewer

React 19, Vite 8, TypeScript, Tailwind CSS 4, and the browser-compatible [PHE hand evaluator](https://github.com/thlorenz/phe).

## Run

Requires Node.js 22.13 or later.

```sh
npm install
npm run dev
```

```sh
npm test
npm run build
npm start
```

## Review a hand

1. Select your two hole cards; click a filled slot to replace it or its X to clear it.
2. Leave the board empty for preflop, or complete the flop before adding the turn and river.
3. Select Opponent Position and Opponent Playstyle.
4. Enter Pot Size and Call Amount in big blinds. Stack Size is optional; if supplied, the call cannot exceed it.

The sidebar updates automatically. Clearing required inputs hides the previous analysis. New card/range inputs terminate old calculations and ignore stale responses. Card selections and inputs are kept in React state and reset on reload.

## Opponent model

These are explicit **assumed ranges**, not solved GTO strategies or measured population statistics. Base widths: Nit 5%, Tight-Aggressive 15%, Loose-Aggressive 30%, Calling Station 40%. Position multipliers: UTG 0.70, MP 1.00, HJ 1.10, CO 1.25, BTN 1.50, SB 1.20, BB 1.10.

An ordered hand-class list is expanded into all combinations for every included class: 6 per pair, 4 per suited hand, 12 per offsuit hand. A range always includes whole classes, so the displayed width is the actual combination count divided by 1,326 and can differ slightly from the target percentage. `generateOpponentRange` also returns a 13×13 matrix for future visualization. Known hero and board cards remove blocked combinations before evaluation. All remaining opponent combinations are weighted equally; no postflop action filter is assumed.

## Equity and decision math

PHE evaluates the best five-card hand from seven cards. The engine enumerates every legal opponent and remaining board combination **exactly on the flop, turn and river**. Preflop uses **100,000 reproducible seeded samples**, explicitly labeled an estimate with an approximate conservative 95% sampling margin. Sampling uncertainty excludes model/range uncertainty. Equity is `win + tie / 2` for a single opponent. Calculations run in a cancellable Web Worker.

**Pot Size includes the opponent’s bet and excludes your prospective call.**

- Pot odds: `call / (pot + call)`
- Call EV: `equity * (pot + call) - call`
- Equivalent EV: `equity * pot - (1 - equity) * call`

This corrects the contradictory initial EV expression, which counted the prospective call again in the win branch. With a 75 BB pot and a 25 BB call, break-even equity is 25%; 30% equity gives +5 BB EV and 20% gives −5 BB EV.

Verdicts compare unrounded equity with pot odds: green for a positive call EV, red for a negative call EV, neutral at break-even, and check when no call is needed. Figures are rounded only for display. Model assumes full equity realization at showdown, no rake, no future betting, and no side pots. A positive estimated EV is not a guarantee of profit.

## Source

- `src/App.tsx`: card/input/opponent state and workspace.
- `src/components/CardPicker.tsx`, `CardSlot.tsx`: card selection and clearing.
- `src/components/AnalysisPanel.tsx`: live metrics, verdict, model explanation.
- `src/poker/ranges.ts`: range generation and matrix data.
- `src/poker/equity.ts`, `equity.worker.ts`, `useEquity.ts`: equity computation and asynchronous lifecycle.
- `src/poker/metrics.ts`, `scenario.ts`: call math and input validation.
- Tests cover known hands, ties, blockers, exact runout counts, deterministic sampling, combo accounting, finances, input gating, stale-worker cancellation, live UI and card picker behavior.

The Sites scaffold's bundled UI library remains available for future work. This app runs directly on Vite as a client-rendered React application.
