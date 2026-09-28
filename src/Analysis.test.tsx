import { it, expect, vi, afterEach, beforeEach } from 'vitest';
import {
  render,
  screen,
  within,
  waitFor,
  cleanup,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { calculateEquity, type EquityInput } from './poker/equity';
import { nextCardOutcomes } from './poker/outs';

// Runs the real engines in-process so the UI shows real numbers.
class InProcessWorker {
  static inputs: { kind: 'equity' | 'outs'; input: EquityInput }[] = [];
  kind: 'equity' | 'outs';
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(url: URL | string) {
    this.kind = String(url).includes('outs') ? 'outs' : 'equity';
  }
  postMessage(input: EquityInput) {
    InProcessWorker.inputs.push({ kind: this.kind, input });
    queueMicrotask(() =>
      this.onmessage?.({
        data: {
          type: 'result',
          result:
            this.kind === 'outs'
              ? nextCardOutcomes(input)
              : calculateEquity(input),
        },
      }),
    );
  }
  terminate() {}
}

const equityRuns = () =>
  InProcessWorker.inputs.filter((run) => run.kind === 'equity');

beforeEach(() => {
  window.location.hash = '#review';
  // Reduced motion: numbers land on their final values without counting up.
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('reduce'),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  InProcessWorker.inputs = [];
});

it('connects villain position and playstyle to the displayed range', async () => {
  const user = userEvent.setup();
  render(<App />);
  const villain = () =>
    screen.getByRole('button', { name: /Change the opponent/ });
  const percentage = () =>
    Number(villain().textContent?.match(/([\d.]+)%/)?.[1]);
  const tag = percentage();
  await user.click(villain());
  await user.click(await screen.findByRole('button', { name: 'Nit' }));
  const btnNit = percentage();
  expect(btnNit).toBeLessThan(tag);
  await user.click(screen.getByRole('button', { name: 'Under the gun' }));
  expect(percentage()).toBeLessThan(btnNit);
  expect(
    screen.getByRole('button', { name: 'Nit' }).getAttribute('aria-pressed'),
  ).toBe('true');
  expect(
    screen
      .getByRole('button', { name: 'Under the gun' })
      .getAttribute('aria-pressed'),
  ).toBe('true');
});

it('waits for required inputs, shows real call EV, then clears stale analysis', async () => {
  vi.stubGlobal('Worker', InProcessWorker);
  const user = userEvent.setup();
  render(<App />);
  // Hole cards A♠ K♠ are already dealt; a royal flush on the flop.
  await user.click(screen.getByRole('button', { name: 'Select Flop card 1' }));
  for (const card of ['Q of Spades', 'J of Spades', '10 of Spades'])
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: card,
      }),
    );
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  for (const [seat, card] of [
    ['Turn', '2 of Clubs'],
    ['River', '3 of Clubs'],
  ]) {
    await user.click(screen.getByRole('button', { name: `Select ${seat}` }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: card,
      }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  }
  expect(equityRuns()).toHaveLength(0);
  await user.type(screen.getByRole('spinbutton', { name: 'Pot size' }), '75');
  expect(equityRuns()).toHaveLength(0);
  await user.type(
    screen.getByRole('spinbutton', { name: 'Bet to call' }),
    '25',
  );

  const decision = await screen.findByRole(
    'region',
    { name: 'The decision' },
    { timeout: 4000 },
  );
  expect(within(decision).getByText('Call')).toBeTruthy();
  expect(within(decision).getByText('+75.00 BB')).toBeTruthy();
  expect(within(decision).getByText('100.0')).toBeTruthy();
  expect(within(decision).getByText('25.0')).toBeTruthy();
  expect(screen.getByRole('region', { name: 'Opponent range' })).toBeTruthy();
  expect(equityRuns()).toHaveLength(1);

  await user.clear(screen.getByRole('spinbutton', { name: 'Bet to call' }));
  expect(screen.queryByRole('region', { name: 'The decision' })).toBeNull();
  expect(screen.queryByText('+75.00 BB')).toBeNull();
}, 20000);

it('scores a practice decision and reveals the modeled best action', async () => {
  vi.stubGlobal('Worker', InProcessWorker);
  window.location.hash = '#practice';
  const user = userEvent.setup();
  render(<App />);
  const fold = await screen.findByRole('button', { name: 'Fold' });
  await waitFor(
    () => expect((fold as HTMLButtonElement).disabled).toBe(false),
    {
      timeout: 8000,
    },
  );
  await user.click(fold);
  expect(
    await screen.findByRole('region', { name: 'The decision' }),
  ).toBeTruthy();
  expect(screen.getAllByText('Best EV').length).toBe(1);
  expect(screen.getByText(/\d+\/1/)).toBeTruthy();
}, 20000);
