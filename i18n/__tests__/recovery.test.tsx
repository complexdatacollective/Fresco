import { act } from '@testing-library/react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';

import { commonMessages } from '@codaco/app-i18n/common';
import { AppMessage } from '@codaco/app-i18n/react';
import RecoveryI18nProvider from '~/i18n/RecoveryI18nProvider';
import { frescoCatalogSource } from '~/src/locales/catalogs';

const view = (
  <RecoveryI18nProvider>
    <main>
      <AppMessage message={commonMessages.retry} />
    </main>
  </RecoveryI18nProvider>
);
const pristine = document.documentElement.cloneNode(true);

afterEach(() => {
  vi.restoreAllMocks();
  document.cookie = 'fresco.locale=; Path=/; Max-Age=0';
  document.replaceChild(pristine.cloneNode(true), document.documentElement);
});

// Holds every catalog download open, so a test can observe what renders while
// the mirrored language is still on its way.
const holdCatalogDownloads = () =>
  vi
    .spyOn(frescoCatalogSource, 'load')
    .mockReturnValue(new Promise(() => undefined));

it('renders a valid fatal-error document and hydrates its independent mirrored-language recovery', async () => {
  const markup = renderToString(view);
  expect(markup).toContain('<html lang="en" dir="ltr">');
  expect(markup).toContain('<body>');
  expect(markup).toContain('Try again');
  document.cookie = 'fresco.locale=es; Path=/';
  document.replaceChild(
    new DOMParser().parseFromString(markup, 'text/html').documentElement,
    document.documentElement,
  );
  const recoverableError = vi.fn();
  const download = holdCatalogDownloads();
  const root = hydrateRoot(document, view, {
    onRecoverableError: recoverableError,
  });
  try {
    await act(async () => {
      await Promise.resolve();
    });
    // Asked for, but not yet loaded: the hydrated page stays in English.
    expect(download).toHaveBeenCalledWith('es');
    expect(document.documentElement.lang).toBe('en');
    expect(document.body.textContent).toBe('Try again');

    download.mockRestore();
    await act(() => frescoCatalogSource.load('es'));
    expect(document.documentElement.lang).toBe('es');
    expect(document.body.textContent).toBe('Volver a intentarlo');
    expect(recoverableError).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
  }
});

it('opens a client-rendered recovery in English while the mirrored language loads', async () => {
  // A root failure on the client renders the page without hydrating, so the
  // mirror is readable from the first render. That render must still not wait
  // on a download: the failed load may be what broke the app.
  document.cookie = 'fresco.locale=de; Path=/';
  const download = holdCatalogDownloads();
  const root = createRoot(document);
  try {
    await act(async () => root.render(view));
    expect(download).toHaveBeenCalledWith('de');
    expect(document.documentElement.lang).toBe('en');
    expect(document.body.textContent).toBe('Try again');

    download.mockRestore();
    await act(() => frescoCatalogSource.load('de'));
    expect(document.documentElement.lang).toBe('de');
    expect(document.body.textContent).toBe('Erneut versuchen');
  } finally {
    await act(async () => root.unmount());
  }
});
