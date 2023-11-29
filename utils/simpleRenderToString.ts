import type { ReactElement } from 'react';
import { createRoot } from 'react-dom/client';

export function simpleRenderToString(element: ReactElement) {
  const container = document.createElement('div');
  const root = createRoot(container);
  root.render(element);

  return container.innerHTML;

  // return new Promise<string>((resolve) => {
  //   setTimeout(() => {
  //     resolve(container.innerHTML);
  //   }, 0);
  // });
}
