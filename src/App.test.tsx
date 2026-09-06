import { afterEach, describe, expect, it } from 'vitest';
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

afterEach(cleanup);

describe('card selection', () => {
  // Catches writing to the wrong group/index or not closing after selection.
  it('fills the clicked hole and community slots independently', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      screen.getByRole('button', { name: 'Select Hole card 2' }),
    );
    await user.click(
      await screen.findByRole('button', { name: 'A of Spades' }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(
      screen.getByRole('button', { name: 'Change Hole card 2: A of Spades' })
        .textContent,
    ).toContain('A');
    expect(
      screen.getByRole('button', { name: 'Select Hole card 1' }),
    ).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Select River' }));
    await user.click(
      await screen.findByRole('button', { name: '10 of Hearts' }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(
      screen.getByRole('button', { name: 'Change River: 10 of Hearts' })
        .textContent,
    ).toContain('♥');
    expect(
      screen.getByRole('button', { name: 'Change Hole card 2: A of Spades' }),
    ).toBeTruthy();
  });

  // Catches duplicate assignments and failing to release replaced/cleared cards.
  it('prevents duplicates and makes replaced or cleared cards available again', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      screen.getByRole('button', { name: 'Select Hole card 1' }),
    );
    await user.click(
      await screen.findByRole('button', { name: 'A of Spades' }),
    );
    await user.click(
      await screen.findByRole('button', { name: 'Select Flop card 1' }),
    );
    expect(
      (
        (await screen.findByRole('button', {
          name: 'A of Spades',
        })) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    await user.keyboard('{Escape}');
    await user.click(
      await screen.findByRole('button', {
        name: 'Change Hole card 1: A of Spades',
      }),
    );
    expect(
      (
        (await screen.findByRole('button', {
          name: 'A of Spades',
        })) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
    await user.click(screen.getByRole('button', { name: 'K of Diamonds' }));
    await user.click(
      await screen.findByRole('button', { name: 'Select Flop card 1' }),
    );
    expect(
      (
        (await screen.findByRole('button', {
          name: 'A of Spades',
        })) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
    expect(
      (
        screen.getByRole('button', {
          name: 'K of Diamonds',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    await user.keyboard('{Escape}');
    await user.click(
      await screen.findByRole('button', { name: 'Clear Hole card 1' }),
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    await user.click(
      screen.getByRole('button', { name: 'Select Flop card 1' }),
    );
    expect(
      (
        (await screen.findByRole('button', {
          name: 'K of Diamonds',
        })) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
  });

  // Catches losing the current selection on cancel and missing focus restoration.
  it('cancels with Escape or close without changing cards and restores slot focus', async () => {
    const user = userEvent.setup();
    render(<App />);
    const slot = screen.getByRole('button', { name: 'Select Turn' });
    slot.focus();
    await user.keyboard('{Enter}');
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getAllByRole('button').length).toBeGreaterThanOrEqual(
      52,
    );
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(slot));
    await user.click(slot);
    await user.click(await screen.findByRole('button', { name: 'Q of Clubs' }));
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
  // Catches missing outside-dismiss wiring or treating dialog content as outside.
  it('keeps the picker open for inside clicks and cancels on the backdrop', async () => {
    const user = userEvent.setup();
    render(<App />);
    const slot = screen.getByRole('button', { name: 'Select Flop card 3' });
    await user.click(slot);
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByText('Choose a card'));
    expect(screen.getByRole('dialog')).toBeTruthy();
    const backdrop = document.querySelector<HTMLElement>(
      '[data-slot="dialog-overlay"]',
    );
    expect(backdrop).not.toBeNull();
    await user.click(backdrop!);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(
      screen.getByRole('button', { name: 'Select Flop card 3' }),
    ).toBeTruthy();
    // Base UI intentionally skips pointer focus restoration when the platform
    // lacks preventScroll (including jsdom). Keyboard restoration is tested above.
  });
});
