# The Felt — Texas Hold’em Hand Reviewer

A responsive heads-up poker study tool: select your cards, model an opponent, and review showdown equity, pot odds, call EV, and an optional AI explanation of the calculated decision.

Built with React 19, Vite 8, TypeScript, Tailwind CSS 4, the browser-compatible [PHE hand evaluator](https://github.com/thlorenz/phe), and an optional Groq-powered explanation endpoint.

## Features

- Interactive card picker with duplicate prevention, replacement, and clearing.
- Position-adjusted opponent ranges for four playstyles.
- Exact postflop equity and repeatable preflop estimates.
- Live pot odds, EV, and math-based call/fold/check verdicts.
- Optional AI explanation that receives the finished math and explains it without replacing the calculator.
- Background calculations with cancellation and input validation.
- Responsive green felt and dark analysis panel.

## Run

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

The calculator itself is fully client-side and does not require an API key. The AI explanation is optional and is served from `api/explain.ts` when deployed on Vercel.

To enable it, create a Groq API key and add this environment variable to the deployment:

```text
GROQ_API_KEY=your_key_here
```

The key is read only by the serverless function and must never be exposed through a `VITE_` environment variable or committed to the repository. If the key is absent or the provider is unavailable, the poker calculator continues to work normally.

The endpoint currently uses `openai/gpt-oss-20b` through Groq. It sends only the calculator output needed for an explanation: opponent profile/range width, equity, pot odds, EV, pot, call amount, and whether the equity result was exact or estimated. The deterministic poker engine remains the source of truth.

## Review a hand

1. Select your two hole cards; click a filled slot to replace it or its X to clear it.
2. Leave the board empty for preflop, or complete the flop before adding the turn and river.
3. Select Opponent Position and Opponent Playstyle.
4. Enter Pot Size and Call Amount in big blinds. Stack Size is optional; if supplied, the call cannot exceed it.
5. Once the math is ready, choose **Explain this decision** for a short AI explanation of the calculated result.

The sidebar updates automatically. Clearing required inputs hides the previous analysis. New card/range inputs terminate old calculations and ignore stale responses. AI explanations are also cleared whenever the underlying analysis changes. Card selections and inputs are kept in React state and reset on reload.

## Opponent model

These are explicit **assumed ranges**, not solved GTO strategies or measured population statistics. Base widths: Nit 5%, Tight-Aggressive 15%, Loose-Aggressive 30%, Calling Station 40%. Position multipliers: UTG 0.70, MP 1.00, HJ 1.10, CO 1.25, BTN 1.50, SB 1.20, BB 1.10.

An ordered hand-class list is expanded into all combinations for every included class: 6 per pair, 4 per suited hand, 12 per offsuit hand. A range always includes whole classes, so the displayed width is the actual combination count divided by 1,326 and can differ slightly from the target percentage. `generateOpponentRange` also returns a 13×13 matrix for future visualization. Known hero and board cards remove blocked combinations before evaluation. All remaining opponent combinations are weighted equally; no postflop action filter is assumed.

## Equity and decision math

PHE evaluates the best five-card hand from seven cards. The engine enumerates every legal opponent and remaining board combination **exactly on the flop, turn and river**. Preflop uses **100,000 reproducible seeded samples**, explicitly labeled an estimate with an approximate conservative 95% sampling margin. Sampling uncertainty excludes model/range uncertainty. Equity is `win + tie / 2` for a single opponent. Calculations run in a cancellable Web Worker.

**Pot Size includes the opponent’s bet and excludes your prospective call.**

- Pot odds: `call / (pot + call)`
- Call EV: `equity * (pot + call) - call`
- Equivalent EV: `equity * pot - (1 - equity) * call`

The call is subtracted once from the expected share of the final pot. With a 75 BB pot and a 25 BB call, break-even equity is 25%; 30% equity gives +5 BB EV and 20% gives −5 BB EV.

Verdicts compare unrounded equity with pot odds: green for a positive call EV, red for a negative call EV, neutral at break-even, and check when no call is needed. Figures are rounded only for display. Model assumes full equity realization at showdown, no rake, no future betting, and no side pots. A positive estimated EV is not a guarantee of profit.

## AI explanation layer

`api/explain.ts` calls Groq’s OpenAI-compatible chat-completions endpoint with a small, fixed payload derived from the completed calculation. The model is instructed to preserve every supplied number, explain rather than recalculate, treat the villain range as an assumption, and keep the answer concise.

The browser never receives `GROQ_API_KEY`. The UI makes a same-origin request to `/api/explain`, and the serverless function calls Groq. This keeps the secret off the client and makes the AI feature optional rather than a dependency of the core calculator.

## Source

- `src/App.tsx`: card/input/opponent state and workspace.
- `src/components/CardPicker.tsx`, `CardSlot.tsx`: card selection and clearing.
- `src/components/AnalysisPanel.tsx`: live metrics, verdict, model explanation, and optional AI explanation UI.
- `src/poker/ranges.ts`: range generation and matrix data.
- `src/poker/equity.ts`, `equity.worker.ts`, `useEquity.ts`: equity computation and asynchronous lifecycle.
- `src/poker/metrics.ts`, `scenario.ts`: call math and input validation.
- `api/explain.ts`: server-side Groq integration for concise explanations.
- Tests cover known hands, ties, blockers, exact runout counts, deterministic sampling, combo accounting, finances, input gating, stale-worker cancellation, live UI and card picker behavior.

The Sites scaffold's bundled UI library remains available for future work. This app runs directly on Vite as a client-rendered React application.

## Deployment

`npm run build` writes a standalone static app to `dist/`. On Vercel, the top-level `api/explain.ts` file is deployed as a serverless function alongside the static frontend. Add `GROQ_API_KEY` to the Vercel project’s environment variables and redeploy to enable AI explanations.

Without the environment variable, or on a static host that does not run the API function, the core hand reviewer still works; only the optional explanation button will return an unavailable message.
