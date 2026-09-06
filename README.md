# The Felt — Texas Hold’em Hand Reviewer

A visual hand-review workspace built with React 19, Vite 8, TypeScript, and Tailwind CSS 4.

## Run locally

Requires Node.js 22.13 or later.

```sh
npm install
npm run dev
```

## Production build

```sh
npm run build
npm start
```

The build runs TypeScript checks and creates the static site in `dist/`.

## Source map

- `src/App.tsx`: responsive 70/30 desktop layout, green felt, seven card placeholders, hand inputs, and analysis sidebar.
- `src/cards.ts`: typed rank/suit definitions and card identity.
- `src/components/CardSlot.tsx`: selectable cards and clear controls.
- `src/components/CardPicker.tsx`: accessible modal with all 52 choices.
- `src/App.test.tsx`: integration tests for selecting, replacing, clearing, duplicate prevention, and modal dismissal.
- `src/styles.css`: Tailwind entry point, font choices, and felt gradient.
- `src/main.tsx`: React entry point.
- `vite.config.ts`: Vite, React, Tailwind PostCSS, and import alias configuration.

Below 1024px, the analysis sidebar stacks beneath the workspace. Inputs use big blinds (BB). Click any card slot to select its rank and suit. Filled slots can be changed or cleared with the X button. Used cards are disabled in other slots. Escape, the close button, or the backdrop dismisses the modal. React state tracks two hole cards and five nullable community slots; selections reset when the page reloads. Analysis values remain intentionally empty.

The Sites scaffold's bundled UI library remains available for future work. This phase uses its input, native select, button, and dialog components. The app itself runs directly on Vite as a client-rendered React application.

## Interaction tests

```sh
npm test
```
