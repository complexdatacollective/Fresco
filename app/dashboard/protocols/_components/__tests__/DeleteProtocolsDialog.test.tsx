import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppI18nProvider } from '@codaco/app-i18n/react';
import type { ProtocolWithInterviews } from '~/app/dashboard/_components/ProtocolsTable/ProtocolsTableClient';
import { DeleteProtocolsDialog } from '~/app/dashboard/protocols/_components/DeleteProtocolsDialog';
import { frescoLocales } from '~/i18n/locales';
import { frescoCatalogSource } from '~/src/locales/catalogs';

const { deleteProtocols } = vi.hoisted(() => ({
  deleteProtocols: vi.fn<(hashes: string[]) => Promise<void>>(),
}));
vi.mock('~/actions/protocols', () => ({ deleteProtocols }));

const protocol: ProtocolWithInterviews = {
  id: 'protocol-1',
  hash: 'hash-1',
  name: 'My Protocol.netcanvas',
  schemaVersion: 8,
  description: null,
  importedAt: new Date(0),
  lastModified: new Date(0),
  stages: [],
  codebook: {},
  experiments: null,
  originalFileKey: null,
  originalFileUrl: null,
  interviews: [],
};

describe('DeleteProtocolsDialog', () => {
  it('cannot be cancelled or dismissed while the deletion runs', async () => {
    const deletion = Promise.withResolvers<void>();
    deleteProtocols.mockReturnValue(deletion.promise);
    const setOpen = vi.fn();
    render(
      <AppI18nProvider
        locale="en"
        locales={frescoLocales}
        messages={frescoCatalogSource.peek('en')}
      >
        <DeleteProtocolsDialog
          open
          setOpen={setOpen}
          protocolsToDelete={[protocol]}
        />
      </AppI18nProvider>,
    );

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: 'Permanently Delete' }));

    expect(
      await screen.findByRole('button', { name: 'Deleting…' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'Close' }),
    ).not.toBeInTheDocument();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(setOpen).not.toHaveBeenCalled();

    deletion.resolve();
    await waitFor(() => expect(setOpen).toHaveBeenCalledWith(false));
    expect(deleteProtocols).toHaveBeenCalledWith(['hash-1']);
  });
});
