import type { ReactElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

export function simpleRenderToString(element: ReactElement) {
  const container = document.createElement('div');
  const root = createRoot(container);

  flushSync(() => root.render(element));
  const inner = container.innerHTML;

  // Cleanup
  root.unmount();
  container.remove();

  return inner;
}
