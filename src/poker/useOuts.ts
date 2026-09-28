import { useEffect, useState } from 'react';
import type { EquityInput } from './equity';
import type { OutsResult } from './outs';

export type OutsState =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; result: OutsResult }
  | { status: 'error'; message: string };

// Mirrors useEquity: cancellable worker, never shows a stale result.
export function useOuts(input: EquityInput | null): OutsState {
  const [finished, setFinished] = useState<{
    input: EquityInput;
    state: OutsState;
  } | null>(null);

  useEffect(() => {
    if (!input) return;
    let active = true;
    let worker: Worker | undefined;
    const timer = setTimeout(() => {
      try {
        worker = new Worker(new URL('./outs.worker.ts', import.meta.url), {
          type: 'module',
        });
        worker.onmessage = (event: MessageEvent) => {
          if (!active) return;
          setFinished({
            input,
            state:
              event.data.type === 'result'
                ? { status: 'ready', result: event.data.result }
                : { status: 'error', message: event.data.message },
          });
          worker?.terminate();
        };
        worker.onerror = () => {
          if (active)
            setFinished({
              input,
              state: { status: 'error', message: 'Could not count the outs.' },
            });
          worker?.terminate();
        };
        worker.postMessage(input);
      } catch {
        if (active)
          setFinished({
            input,
            state: { status: 'error', message: 'Could not count the outs.' },
          });
      }
    }, 150);
    return () => {
      active = false;
      clearTimeout(timer);
      worker?.terminate();
    };
  }, [input]);

  if (!input) return { status: 'idle' };
  return finished?.input === input ? finished.state : { status: 'loading' };
}
