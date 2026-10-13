import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppI18nProvider } from '@codaco/app-i18n/react';
import UploadThingModal from '~/app/dashboard/_components/UploadThingModal';
import { frescoLocales } from '~/i18n/locales';
import { frescoCatalogSource } from '~/src/locales/catalogs';

const { setUploadThingToken, setStorageProvider, push } = vi.hoisted(() => ({
  setUploadThingToken: vi.fn(),
  setStorageProvider: vi.fn(),
  push: vi.fn(),
}));
vi.mock('~/actions/appSettings', () => ({ setUploadThingToken }));
vi.mock('~/actions/storageProvider', () => ({ setStorageProvider }));
vi.mock('~/lib/posthog-client', () => ({ captureClientException: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

describe('UploadThingModal', () => {
  it('cannot be dismissed while the token is saved', async () => {
    const saving = Promise.withResolvers<unknown>();
    setUploadThingToken.mockReturnValue(saving.promise);
    setStorageProvider.mockResolvedValue({ success: true });
    render(
      <AppI18nProvider
        locale="en"
        locales={frescoLocales}
        messages={frescoCatalogSource.peek('en')}
      >
        <UploadThingModal />
      </AppI18nProvider>,
    );

    const dialog = await screen.findByRole('dialog', {
      name: 'Required Environment Variable Update',
    });
    fireEvent.change(
      screen.getByRole('textbox', { name: 'UPLOADTHING_TOKEN' }),
      { target: { value: 'UPLOADTHING_TOKEN=abcdefghijklmnop' } },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));

    await waitFor(() => expect(setUploadThingToken).toHaveBeenCalled());
    expect(
      screen.queryByRole('button', { name: 'Close' }),
    ).not.toBeInTheDocument();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(dialog).toBeInTheDocument();

    saving.resolve({ success: true });
    await waitFor(() => expect(push).toHaveBeenCalledWith('/setup?step=3'));
    expect(setStorageProvider).toHaveBeenCalledWith('uploadthing');
  });
});
