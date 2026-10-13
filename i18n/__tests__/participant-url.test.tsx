import { Toast } from '@base-ui/react/toast';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppI18nProvider } from '@codaco/app-i18n/react';
import { Toaster } from '@codaco/fresco-ui/Toast';
import { GenerateParticipationURLButton } from '~/app/dashboard/_components/ParticipantsTable/GenerateParticipantURLButton';
import type { ProtocolWithInterviews } from '~/app/dashboard/_components/ProtocolsTable/ProtocolsTableClient';
import { frescoLocales } from '~/i18n/locales';
import { frescoCatalogSource } from '~/src/locales/catalogs';

const protocol: ProtocolWithInterviews = {
  id: 'protocol-1',
  hash: 'hash-1',
  name: 'Research protocol',
  schemaVersion: 8,
  description: null,
  importedAt: new Date('2026-09-05T00:00:00Z'),
  lastModified: new Date('2026-09-05T00:00:00Z'),
  stages: [],
  codebook: {},
  experiments: null,
  originalFileKey: null,
  originalFileUrl: null,
  interviews: [],
};

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
      <GenerateParticipationURLButton
        participant={{ identifier: 'Participant / María' }}
        protocols={[protocol]}
      />
      <Toaster />
    </Toast.Provider>
  </AppI18nProvider>
);

describe('localized participant URL generation', () => {
  it('opens on the first activation, updates the open picker, and preserves stable URL values', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const { rerender } = render(view('en'));
    const trigger = screen.getByRole('button', { name: 'Copy Unique URL' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    trigger.focus();
    fireEvent.click(trigger);
    const picker = await screen.findByRole('combobox', {
      name: 'Select a Protocol...',
    });
    await waitFor(() => expect(picker).toBeVisible());
    picker.focus();
    rerender(view('es'));
    expect(
      screen.getByRole('combobox', { name: 'Seleccionar un protocolo...' }),
    ).toBe(picker);
    expect(picker).toHaveFocus();
    fireEvent.change(picker, { target: { value: protocol.id } });
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const url = new URL(writeText.mock.calls[0]![0] as string);
    expect(url.pathname).toBe('/onboard/protocol-1/');
    expect(url.searchParams.get('participantIdentifier')).toBe(
      'Participant / María',
    );
    expect(
      await screen.findByText('URL copiada al portapapeles'),
    ).toBeVisible();
    rerender(view('en'));
    expect(screen.getByText('URL copied to clipboard!')).toBeVisible();
    expect(writeText).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(picker, { key: 'Escape' });
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.getByRole('button', { name: 'Copy Unique URL' })).toBe(
      trigger,
    );
  });
});
