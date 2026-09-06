# The Felt — Texas Hold’em Hand Reviewer

A static UI shell built with React 19, Vite 8, TypeScript, and Tailwind CSS 4.

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
- `src/styles.css`: Tailwind entry point, font choices, and felt gradient.
- `src/main.tsx`: React entry point.
- `vite.config.ts`: Vite, React, Tailwind PostCSS, and import alias configuration.

Below 1024px, the analysis sidebar stacks beneath the workspace. Inputs use big blinds (BB). Number inputs and the position dropdown retain native browser behavior, but there are no application state hooks, calculations, card pickers, modal dialogs, or event handlers. Analysis values are intentionally empty.

The Sites scaffold's bundled UI library remains available for future work. This shell uses only its input and native select components. The app itself runs directly on Vite as a client-rendered React application.
