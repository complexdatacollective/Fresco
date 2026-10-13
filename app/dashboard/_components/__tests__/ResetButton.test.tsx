import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppI18nProvider } from '@codaco/app-i18n/react';
import ResetButton from '~/app/dashboard/_components/ResetButton';
import { frescoLocales } from '~/i18n/locales';
import { frescoCatalogSource } from '~/src/locales/catalogs';

const { resetAppSettings } = vi.hoisted(() => ({
  resetAppSettings: vi.fn<() => Promise<void>>(),
}));
vi.mock('~/actions/reset', () => ({ resetAppSettings }));

describe('ResetButton', () => {
  it('cannot be cancelled or dismissed while the reset runs', async () => {
    const reset = Promise.withResolvers<void>();
    resetAppSettings.mockReturnValue(reset.promise);
    render(
      <AppI18nProvider
        locale="en"
        locales={frescoLocales}
        messages={frescoCatalogSource.peek('en')}
      >
        <ResetButton />
      </AppI18nProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reset all app data' }));
    const dialog = await screen.findByRole('dialog', { name: 'Are you sure?' });
    fireEvent.click(screen.getByRole('button', { name: 'Delete all data' }));

    expect(
      await screen.findByRole('button', { name: 'Resetting...' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'Close' }),
    ).not.toBeInTheDocument();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(dialog).toBeInTheDocument();

    // A failed reset hands the dialog back, so it can be left again.
    reset.reject(new Error('reset failed'));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled(),
    );
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });
});
