import { Toast } from '@base-ui/react/toast';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import JSZip from 'jszip';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppI18nProvider } from '@codaco/app-i18n/react';
import { Toaster } from '@codaco/fresco-ui/Toast';
import { useProtocolImport } from '~/hooks/useProtocolImport';
import { frescoLocales } from '~/i18n/locales';
import { frescoCatalogSource } from '~/src/locales/catalogs';

const {
  getProtocolByHash,
  getNewAssetIds,
  insertProtocol,
  uploadAssets,
  cleanupUploadedFiles,
} = vi.hoisted(() => ({
  getProtocolByHash: vi.fn(),
  getNewAssetIds: vi.fn(),
  insertProtocol: vi.fn(),
  uploadAssets: vi.fn(),
  cleanupUploadedFiles: vi.fn(),
}));
vi.mock('~/actions/protocols', () => ({
  getProtocolByHash,
  getNewAssetIds,
  insertProtocol,
  cleanupUploadedFiles,
}));
vi.mock('~/hooks/useUploadAssets', () => ({
  useUploadAssets: () => ({ uploadAssets }),
}));
vi.mock('~/lib/posthog-client', () => ({
  captureClientEvent: vi.fn(),
  captureClientException: vi.fn(),
}));

function ImportButton({ file }: { file: File }) {
  const { importProtocols } = useProtocolImport();
  return <button onClick={() => importProtocols([file])}>Start import</button>;
}
// Loaded up front, so every render and formatter below has Spanish
// synchronously.
await frescoCatalogSource.load('es');

const view = (locale: string, file: File) => (
  <AppI18nProvider
    locale={locale}
    locales={frescoLocales}
    messages={frescoCatalogSource.peek(locale)}
  >
    <Toast.Provider>
      <ImportButton file={file} />
      <Toaster />
    </Toast.Provider>
  </AppI18nProvider>
);

async function archiveFile(contents: string) {
  const zip = new JSZip();
  zip.file('protocol.json', contents);
  return new File(
    [await zip.generateAsync({ type: 'arraybuffer' })],
    'fixture.netcanvas',
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getProtocolByHash.mockResolvedValue(null);
  getNewAssetIds.mockResolvedValue([]);
  insertProtocol.mockResolvedValue({ error: null });
  uploadAssets.mockResolvedValue([
    {
      name: 'fixture.netcanvas',
      key: 'fixture-key',
      url: 'https://example.test/fixture.netcanvas',
    },
  ]);
});

describe('truthful protocol import failure messages', () => {
  it.each(['lookup', 'upload', 'save'])(
    'does not blame a valid protocol for a rejected %s request and permits retry',
    async (operation) => {
      const file = await archiveFile(
        JSON.stringify({
          schemaVersion: 8,
          name: 'Fixture',
          lastModified: '2026-09-05T00:00:00.000Z',
          stages: [],
          codebook: { node: {}, edge: {}, ego: {} },
          assetManifest: {},
        }),
      );
      const failing =
        operation === 'lookup'
          ? getProtocolByHash
          : operation === 'upload'
            ? uploadAssets
            : insertProtocol;
      failing.mockRejectedValueOnce(new Error('Network request failed'));
      const { rerender } = render(view('en', file));
      fireEvent.click(screen.getByRole('button', { name: 'Start import' }));
      await waitFor(() => expect(failing).toHaveBeenCalledTimes(1));
      expect(
        await screen.findByText(
          'The protocol could not be imported. Check your connection and storage configuration, then try again.',
        ),
      ).toBeVisible();
      expect(
        screen.queryByText(
          'The uploaded file does not contain a valid protocol.',
        ),
      ).not.toBeInTheDocument();
      rerender(view('es', file));
      expect(
        screen.getByText(
          'No se pudo importar el protocolo. Comprueba tu conexión y la configuración del almacenamiento e inténtalo de nuevo.',
        ),
      ).toBeVisible();
      fireEvent.click(
        screen.getByRole('button', { name: 'Volver a intentarlo' }),
      );
      expect(
        await screen.findByText('Protocolo importado correctamente'),
      ).toBeVisible();
      await waitFor(() => expect(failing).toHaveBeenCalledTimes(2));
    },
  );

  it.each([
    [
      'non-archive',
      async () => new File(['not a zip archive'], 'fixture.netcanvas'),
      "This file isn't a Network Canvas protocol. Check that you chose the right file, and that it finished downloading.",
    ],
    [
      'damaged JSON',
      () => archiveFile('{broken json'),
      "This protocol's contents are damaged and cannot be read. Try a backup, or the copy you originally downloaded.",
    ],
  ])(
    'uses the owning-package explanation for %s before making server calls',
    async (_name, fileFactory, message) => {
      render(view('en', await fileFactory()));
      fireEvent.click(screen.getByRole('button', { name: 'Start import' }));
      expect(await screen.findByText(message)).toBeVisible();
      expect(getProtocolByHash).not.toHaveBeenCalled();
      expect(uploadAssets).not.toHaveBeenCalled();
    },
  );
});
