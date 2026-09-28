import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

beforeEach(() => {
  window.location.hash = '#review';
});
afterEach(cleanup);

async function pick(name: string) {
  await userEvent.click(
    within(await screen.findByRole('dialog')).getByRole('button', { name }),
  );
}

describe('the entry', () => {
  // Catches the entry losing its way into the table.
  it('opens the table with the two cards it dealt', async () => {
    window.location.hash = '';
    sessionStorage.clear();
    const user = userEvent.setup();
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /Review the hand/ }),
    ).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /Review a hand/ }));
    expect(
      await screen.findByRole('button', {
        name: 'Change Hole card 1: A of Spades',
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Change Hole card 2: K of Spades' }),
    ).toBeTruthy();
  });
});

describe('card selection', () => {
  // Catches writing to the wrong group/index or not closing after the street.
  it('fills the clicked hole and community seats independently', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      screen.getByRole('button', { name: 'Change Hole card 2: K of Spades' }),
    );
    await pick('Q of Hearts');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(
      screen.getByRole('button', { name: 'Change Hole card 2: Q of Hearts' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Change Hole card 1: A of Spades' }),
    ).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Select River' }));
    await pick('10 of Hearts');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(
      screen.getByRole('button', { name: 'Change River: 10 of Hearts' }),
    ).toBeTruthy();
  });

  // Catches the tray closing mid-flop or skipping a flop seat.
  it('keeps the tray open to deal the rest of the flop', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      screen.getByRole('button', { name: 'Select Flop card 1' }),
    );
    await pick('Q of Spades');
    expect(
      within(screen.getByRole('dialog')).getByRole('heading', {
        name: 'Flop card 2',
      }),
    ).toBeTruthy();
    await pick('J of Spades');
    expect(
      within(screen.getByRole('dialog')).getByRole('heading', {
        name: 'Flop card 3',
      }),
    ).toBeTruthy();
    await pick('2 of Clubs');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    for (const [seat, card] of [
      ['Flop card 1', 'Q of Spades'],
      ['Flop card 2', 'J of Spades'],
      ['Flop card 3', '2 of Clubs'],
    ])
      expect(
        screen.getByRole('button', { name: `Change ${seat}: ${card}` }),
      ).toBeTruthy();
  });

  // Catches the type-to-pick shortcut placing the wrong card.
  it('deals a typed card: rank, then suit', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Select Turn' }));
    await screen.findByRole('dialog');
    await user.keyboard('qh');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(
      screen.getByRole('button', { name: 'Change Turn: Q of Hearts' }),
    ).toBeTruthy();
  });

  // Catches duplicate assignments and failing to release replaced/cleared cards.
  it('prevents duplicates and makes replaced or cleared cards available again', async () => {
    const user = userEvent.setup();
    render(<App />);
    const disabled = async (name: string) =>
      (
        within(await screen.findByRole('dialog')).getByRole('button', {
          name,
        }) as HTMLButtonElement
      ).disabled;

    await user.click(
      screen.getByRole('button', { name: 'Select Flop card 1' }),
    );
    expect(await disabled('A of Spades')).toBe(true);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    await user.click(
      screen.getByRole('button', { name: 'Change Hole card 1: A of Spades' }),
    );
    expect(await disabled('A of Spades')).toBe(false);
    await pick('K of Diamonds');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    await user.click(
      screen.getByRole('button', { name: 'Select Flop card 1' }),
    );
    expect(await disabled('A of Spades')).toBe(false);
    expect(await disabled('K of Diamonds')).toBe(true);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    await user.click(screen.getByRole('button', { name: 'Clear Hole card 1' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await user.click(
      screen.getByRole('button', { name: 'Select Flop card 1' }),
    );
    expect(await disabled('K of Diamonds')).toBe(false);
  });

  // Catches losing the current card on cancel and missing focus restoration.
  it('cancels with Escape or Close without changing cards and restores seat focus', async () => {
    const user = userEvent.setup();
    render(<App />);
    const seat = screen.getByRole('button', { name: 'Select Turn' });
    seat.focus();
    await user.keyboard('{Enter}');
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getAllByRole('button', { name: / of / }),
    ).toHaveLength(52);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(seat));

    await user.click(seat);
    await pick('Q of Clubs');
    await user.click(
      await screen.findByRole('button', { name: 'Change Turn: Q of Clubs' }),
    );
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Close',
      }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(
      screen.getByRole('button', { name: 'Change Turn: Q of Clubs' }),
    ).toBeTruthy();
  });

  // Catches missing outside-dismiss wiring or treating tray content as outside.
  it('keeps the tray open for inside clicks and cancels on the backdrop', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      screen.getByRole('button', { name: 'Select Flop card 3' }),
    );
    const dialog = await screen.findByRole('dialog');
    await user.click(
      within(dialog).getByRole('heading', { name: 'Flop card 3' }),
    );
    expect(screen.getByRole('dialog')).toBeTruthy();
    const backdrop = document.querySelector<HTMLElement>('.tray-backdrop');
    expect(backdrop).not.toBeNull();
    await user.click(backdrop!);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(
      screen.getByRole('button', { name: 'Select Flop card 3' }),
    ).toBeTruthy();
  });
});
