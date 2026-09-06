import { useEffect, useState } from 'react';
import type { EquityInput, EquityResult } from './equity';
export type EquityState =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; result: EquityResult }
  | { status: 'error'; message: string };
export function useEquity(input: EquityInput | null): EquityState {
  const [finished, setFinished] = useState<{
    input: EquityInput;
    state: EquityState;
  } | null>(null);
  useEffect(() => {
    if (!input) return;
    let active = true;
    let worker: Worker | undefined;
    const timer = setTimeout(() => {
      try {
        worker = new Worker(new URL('./equity.worker.ts', import.meta.url), {
          type: 'module',
        });
        worker.onmessage = (event: MessageEvent) => {
          if (!active) return;
          const state: EquityState =
            event.data.type === 'result'
              ? { status: 'ready', result: event.data.result }
              : { status: 'error', message: event.data.message };
          setFinished({ input, state });
          worker?.terminate();
        };
        worker.onerror = () => {
          if (active)
            setFinished({
              input,
              state: {
                status: 'error',
                message:
                  'The equity calculation failed. Change a card or opponent setting to retry.',
              },
            });
          worker?.terminate();
        };
        worker.postMessage(input);
      } catch {
        if (active)
          setFinished({
            input,
            state: {
              status: 'error',
              message: 'Your browser could not start the equity calculator.',
            },
          });
      }
    }, 100);
    return () => {
      active = false;
      clearTimeout(timer);
      worker?.terminate();
    };
  }, [input]);
  if (!input) return { status: 'idle' };
  return finished?.input === input ? finished.state : { status: 'loading' };
}
