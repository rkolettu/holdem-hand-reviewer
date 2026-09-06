import { it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act, cleanup } from '@testing-library/react';
import { useEquity } from './useEquity';
import type { EquityInput } from './equity';
class ControlledWorker {
  static instances: ControlledWorker[] = [];
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  terminated = false;
  constructor() {
    ControlledWorker.instances.push(this);
  }
  postMessage() {}
  terminate() {
    this.terminated = true;
  }
  reply(equity: number) {
    this.onmessage?.({ data: { type: 'result', result: { equity } } });
  }
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  ControlledWorker.instances = [];
});
it('cancels obsolete work and never displays a stale result', async () => {
  vi.stubGlobal('Worker', ControlledWorker);
  const first = {} as EquityInput,
    second = {} as EquityInput;
  const { result, rerender } = renderHook(({ input }) => useEquity(input), {
    initialProps: { input: first as EquityInput | null },
  });
  await waitFor(() => expect(ControlledWorker.instances).toHaveLength(1));
  const old = ControlledWorker.instances[0];
  rerender({ input: second });
  expect(result.current.status).toBe('loading');
  await waitFor(() => expect(ControlledWorker.instances).toHaveLength(2));
  expect(old.terminated).toBe(true);
  act(() => old.reply(0.99));
  expect(result.current.status).toBe('loading');
  act(() => ControlledWorker.instances[1].reply(0.25));
  expect(result.current).toMatchObject({
    status: 'ready',
    result: { equity: 0.25 },
  });
  rerender({ input: null });
  expect(result.current.status).toBe('idle');
});
