import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createAppIntl } from '@codaco/app-i18n/messages';
import { AppI18nProvider } from '@codaco/app-i18n/react';
import DialogProvider from '@codaco/fresco-ui/dialogs/DialogProvider';
import PasskeySettings from '~/app/dashboard/settings/_components/PasskeySettings';
import { formatActivityDetails } from '~/i18n/activityDetails';
import { frescoLocales } from '~/i18n/locales';
import { frescoCatalogSource } from '~/src/locales/catalogs';

vi.mock('@simplewebauthn/browser', () => ({ startRegistration: vi.fn() }));
vi.mock('~/actions/webauthn', () => ({
  generateRegistrationOptions: vi.fn(),
  verifyRegistration: vi.fn(),
  removePasskey: vi.fn(),
}));

// Loaded up front, so every render and formatter below has Spanish
// synchronously.
const es = await frescoCatalogSource.load('es');

const view = (
  locale: string,
  friendlyName: string | null,
  deviceType: string,
) => (
  <AppI18nProvider
    locale={locale}
    locales={frescoLocales}
    messages={frescoCatalogSource.peek(locale)}
  >
    <DialogProvider>
      <PasskeySettings
        sandboxMode={false}
        hasPassword
        initialPasskeys={[
          {
            id: 'credential-1',
            friendlyName,
            deviceType,
            backedUp: false,
            createdAt: new Date('2026-09-05T00:00:00Z'),
            lastUsedAt: null,
          },
        ]}
      />
    </DialogProvider>
  </AppI18nProvider>
);

describe('passkey names in researcher chrome', () => {
  it.each([
    ['multiDevice', 'Synced passkey', 'Llave de acceso sincronizada'],
    ['singleDevice', 'Security key', 'Llave de seguridad'],
  ])(
    'changes a generic %s name in the list and an already open removal confirmation',
    async (deviceType, english, spanish) => {
      const { rerender } = render(view('en', null, deviceType));
      expect(screen.getByText(english)).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
      const dialog = await screen.findByRole('dialog', {
        name: 'Remove Passkey',
      });
      expect(dialog).toHaveTextContent(`Remove "${english}"?`);
      rerender(view('es', null, deviceType));
      expect(dialog).toHaveTextContent(`¿Eliminar «${spanish}»?`);
      expect(screen.getByText(spanish)).toBeVisible();
      fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
      expect(screen.getByText(spanish)).toBeVisible();
    },
  );

  it.each(['Chrome on Mac', 'Mi llave <img src=x>', 'Synced passkey'])(
    'preserves the stored name %s across language changes',
    (name) => {
      const { rerender, container } = render(view('en', name, 'multiDevice'));
      // The stored values include vendor, authored, and ambiguous historical fallback names.
      rerender(view('es', name, 'multiDevice'));
      expect(screen.getByText(name)).toBeVisible();
      expect(container.querySelector('img')).toBeNull();
    },
  );

  it.each([
    'passkeyRegistered',
    'accountCreatedWithPasskey',
    'passkeyRemoved',
    'switchedToPasskey',
  ])(
    'localizes generated values for %s while preserving legacy and rejecting invalid identity metadata',
    (kind) => {
      const intl = createAppIntl({ locale: 'es', messages: es });
      const values = {
        username: 'Researcher',
        passkey: '',
        ...(kind === 'passkeyRemoved' ? { nameMode: 'named' } : {}),
      };
      expect(
        formatActivityDetails(intl, {
          message: 'original record',
          localization: {
            kind,
            values: { ...values, passkeyDeviceType: 'singleDevice' },
          },
        }),
      ).toContain('Llave de seguridad');
      expect(
        formatActivityDetails(intl, {
          message: 'original record',
          localization: {
            kind,
            values: { ...values, passkey: 'Synced passkey' },
          },
        }),
      ).toContain('Synced passkey');
      expect(
        formatActivityDetails(intl, {
          message: 'original record',
          localization: {
            kind,
            values: { ...values, passkeyDeviceType: 'arbitrary prose' },
          },
        }),
      ).toBe('original record');
    },
  );
});
