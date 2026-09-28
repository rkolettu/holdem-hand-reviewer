import type { EquityInput } from './equity';
import { nextCardOutcomes } from './outs';
self.onmessage = (event: MessageEvent<EquityInput>) => {
  try {
    self.postMessage({ type: 'result', result: nextCardOutcomes(event.data) });
  } catch (error) {
    self.postMessage({
      type: 'error',
      message:
        error instanceof Error ? error.message : 'Could not count the outs.',
    });
  }
};
