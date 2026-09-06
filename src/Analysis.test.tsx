import { it, expect, vi, afterEach } from 'vitest';
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
class InProcessWorker {
  static inputs: EquityInput[] = [];
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  postMessage(input: EquityInput) {
    InProcessWorker.inputs.push(input);
    queueMicrotask(() =>
      this.onmessage?.({
        data: { type: 'result', result: calculateEquity(input) },
      }),
    );
  }
  terminate() {}
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  InProcessWorker.inputs = [];
});
it('connects opponent position and playstyle to the displayed range', async () => {
  const user = userEvent.setup();
  render(<App />);
  const range = screen.getByRole('region', { name: 'Opponent range' });
  const percentage = () => Number(range.textContent?.match(/([\d.]+)%/)?.[1]);
  const tag = percentage();
  await user.click(screen.getByRole('button', { name: 'Nit' }));
  const btnNit = percentage();
  expect(btnNit).toBeLessThan(tag);
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Opponent Position' }),
    'UTG',
  );
  expect(percentage()).toBeLessThan(btnNit);
  expect(
    screen.getByRole('button', { name: 'Nit' }).getAttribute('aria-pressed'),
  ).toBe('true');
});
it('waits for required inputs, shows real equity/EV, then clears stale analysis', async () => {
  vi.stubGlobal('Worker', InProcessWorker);
  const user = userEvent.setup();
  render(<App />);
  const choices = [
    ['Hole card 1', 'A of Spades'],
    ['Hole card 2', 'K of Spades'],
    ['Flop card 1', 'Q of Spades'],
    ['Flop card 2', 'J of Spades'],
    ['Flop card 3', '10 of Spades'],
    ['Turn', '2 of Clubs'],
    ['River', '3 of Clubs'],
  ];
  for (const [slot, card] of choices) {
    await user.click(screen.getByRole('button', { name: `Select ${slot}` }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: card,
      }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  }
  expect(InProcessWorker.inputs).toHaveLength(0);
  await user.type(screen.getByRole('spinbutton', { name: 'Pot Size' }), '75');
  expect(InProcessWorker.inputs).toHaveLength(0);
  await user.type(
    screen.getByRole('spinbutton', { name: 'Call Amount' }),
    '25',
  );
  await screen.findByText('+EV Decision');
  expect(screen.getByText('100.0')).toBeTruthy();
  expect(screen.getByText('25.0')).toBeTruthy();
  expect(screen.getByText('+75.00')).toBeTruthy();
  expect(InProcessWorker.inputs).toHaveLength(1);
  await user.clear(screen.getByRole('spinbutton', { name: 'Call Amount' }));
  expect(screen.queryByText('+EV Decision')).toBeNull();
  expect(screen.queryByText('+75.00')).toBeNull();
}, 15000);
