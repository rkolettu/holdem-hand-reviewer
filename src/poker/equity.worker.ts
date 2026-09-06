import { calculateEquity, type EquityInput } from './equity';
self.onmessage = (event: MessageEvent<EquityInput>) => {
  try {
    self.postMessage({ type: 'result', result: calculateEquity(event.data) });
  } catch (error) {
    self.postMessage({
      type: 'error',
      message:
        error instanceof Error ? error.message : 'Could not calculate equity.',
    });
  }
};
