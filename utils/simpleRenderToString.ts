import type { ReactElement } from 'react';
import { createRoot } from 'react-dom/client';

export async function simpleRenderToString(element: ReactElement) {
  const container = document.createElement('div');
  const root = createRoot(container);
  root.render(element);

  return new Promise<string>((resolve) => {
    setTimeout(() => {
      resolve(container.innerHTML);
    }, 1);
  });
}
