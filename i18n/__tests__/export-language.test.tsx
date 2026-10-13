import { Toast } from '@base-ui/react/toast';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppI18nProvider } from '@codaco/app-i18n/react';
import { Toaster } from '@codaco/fresco-ui/Toast';
import type { ExportOptions } from '@codaco/network-exporters/options';
import {
  ExportProgressProvider,
  useExportProgress,
} from '~/components/ExportProgressProvider';
import { frescoLocales } from '~/i18n/locales';
import { frescoCatalogSource } from '~/src/locales/catalogs';

const { runBatchedExport } = vi.hoisted(() => ({ runBatchedExport: vi.fn() }));
vi.mock('~/lib/export/runBatchedExport', () => ({ runBatchedExport }));
vi.mock('~/actions/interviews', () => ({ commitInterviewExport: vi.fn() }));
vi.mock('~/hooks/useDownload', () => ({ useDownload: () => vi.fn() }));
vi.mock('~/lib/posthog-client', () => ({ captureClientException: vi.fn() }));

function StartExport() {
  const { startExport } = useExportProgress();
  return (
    <button
      type="button"
      onClick={() =>
        startExport(['interview-1'], {
          exportCSV: true,
          exportGraphML: true,
          globalOptions: {
            useScreenLayoutCoordinates: false,
            screenLayoutHeight: 800,
            screenLayoutWidth: 1200,
          },
        })
      }
    >
      Start test export
    </button>
  );
}
// Loaded up front, so every render and formatter below has Spanish
// synchronously.
await frescoCatalogSource.load('es');

const view = (locale: string) => (
  <AppI18nProvider
    locale={locale}
    locales={frescoLocales}
    messages={frescoCatalogSource.peek(locale)}
  >
    <Toast.Provider>
      <ExportProgressProvider>
        <StartExport />
        <Toaster />
      </ExportProgressProvider>
    </Toast.Provider>
  </AppI18nProvider>
);

describe('ongoing Fresco export localization', () => {
  it('updates an already-visible export title, owning-package stage, and cancellation response', async () => {
    runBatchedExport.mockImplementation(
      (_ids: string[], _options: ExportOptions, signal: AbortSignal) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true },
          );
        }),
    );
    const { rerender } = render(view('en'));
    fireEvent.click(screen.getByRole('button', { name: 'Start test export' }));
    expect(
      await screen.findByRole('heading', { name: 'Exporting interviews' }),
    ).toBeVisible();
    expect(screen.getByText('Fetching interview data...')).toBeVisible();
    rerender(view('es'));
    expect(
      screen.getByRole('heading', { name: 'Exportando entrevistas' }),
    ).toBeVisible();
    expect(
      screen.getByText('Obteniendo los datos de las entrevistas…'),
    ).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Exportación cancelada' }),
      ).toBeVisible(),
    );
    expect(screen.getByText('Se canceló la exportación.')).toBeVisible();
  });
});
