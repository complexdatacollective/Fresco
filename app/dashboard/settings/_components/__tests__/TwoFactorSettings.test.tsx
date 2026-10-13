import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMessageError, defineMessage } from '@codaco/app-i18n/messages';
import { AppI18nProvider } from '@codaco/app-i18n/react';
import TwoFactorSettings from '~/app/dashboard/settings/_components/TwoFactorSettings';
import { frescoLocales } from '~/i18n/locales';
import { frescoCatalogSource } from '~/src/locales/catalogs';

const { verifyCurrentUserTotp, disableTotp, regenerateRecoveryCodes } =
  vi.hoisted(() => ({
    verifyCurrentUserTotp: vi.fn(),
    disableTotp: vi.fn(),
    regenerateRecoveryCodes: vi.fn(),
  }));
vi.mock('~/actions/totp', () => ({
  verifyCurrentUserTotp,
  disableTotp,
  regenerateRecoveryCodes,
}));
vi.mock('~/components/TwoFactorSetup', () => ({
  useTwoFactorSetup: () => vi.fn(),
}));

const requiredByInstallation = defineMessage({
  id: 'fresco.actions.totp.twoFactorRequiredByInstallation',
  defaultMessage:
    'This installation of Fresco requires two-factor authentication for every account that signs in with a password, so it cannot be turned off.',
  description: 'Disable refused while REQUIRE_TWO_FACTOR is set.',
});

const RECOVERY_CODE = '0123456789abcdef0123';

const renderSettings = () =>
  render(
    <AppI18nProvider
      locale="en"
      locales={frescoLocales}
      messages={frescoCatalogSource.peek('en')}
    >
      <TwoFactorSettings hasTwoFactor userCount={1} />
    </AppI18nProvider>,
  );

const openDisableDialog = async () => {
  fireEvent.click(
    screen.getByRole('switch', { name: 'Toggle two-factor authentication' }),
  );
  const dialog = await screen.findByRole('dialog', {
    name: 'Disable Two-Factor Authentication',
  });
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'Use a recovery code instead' }),
  );
  fireEvent.change(
    within(dialog).getByRole('textbox', {
      name: 'Enter one of your recovery codes',
    }),
    { target: { value: RECOVERY_CODE } },
  );
  return dialog;
};

const expectHeldOpen = (dialog: HTMLElement) => {
  expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled();
  expect(
    within(dialog).queryByRole('button', { name: 'Close' }),
  ).not.toBeInTheDocument();
  fireEvent.keyDown(dialog, { key: 'Escape' });
  expect(dialog).toBeInTheDocument();
};

describe('TwoFactorSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifyCurrentUserTotp.mockResolvedValue({ success: true });
  });

  it('holds the disable dialog open until two-factor is disabled', async () => {
    const disabling = Promise.withResolvers<unknown>();
    disableTotp.mockReturnValue(disabling.promise);
    renderSettings();

    const dialog = await openDisableDialog();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Disable' }));

    await waitFor(() =>
      expect(disableTotp).toHaveBeenCalledWith({ code: RECOVERY_CODE }),
    );
    expect(
      within(dialog).getByRole('button', { name: 'Disabling...' }),
    ).toBeDisabled();
    expectHeldOpen(dialog);

    disabling.resolve({ error: null, data: null });
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole('switch', { name: 'Toggle two-factor authentication' }),
    ).not.toBeChecked();
  });

  it('shows a refused disable on the form and stays open', async () => {
    disableTotp.mockResolvedValue({
      error: createMessageError(requiredByInstallation),
      data: null,
    });
    renderSettings();

    const dialog = await openDisableDialog();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Disable' }));

    expect(
      await within(dialog).findByText(requiredByInstallation.defaultMessage),
    ).toBeVisible();
    expect(
      within(dialog).getByRole('button', { name: 'Cancel' }),
    ).toBeEnabled();
    // The open dialog hides the page behind it from the accessibility tree.
    expect(
      screen.getByRole('switch', {
        name: 'Toggle two-factor authentication',
        hidden: true,
      }),
    ).toBeChecked();
  });

  it('holds the regenerate dialog open until the new codes arrive', async () => {
    const regenerating = Promise.withResolvers<unknown>();
    regenerateRecoveryCodes.mockReturnValue(regenerating.promise);
    renderSettings();

    fireEvent.click(
      screen.getByRole('button', { name: 'Regenerate Recovery Codes' }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Regenerate Recovery Codes',
    });
    // Without recovery codes on offer, the only way in is the 6-digit code;
    // typing the whole code into its first segment fills every segment.
    const [firstDigit] = within(dialog).getAllByRole('textbox');
    if (!firstDigit) throw new Error('missing code segment');
    fireEvent.input(firstDigit, { target: { value: '123456' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Regenerate' }));

    await waitFor(() =>
      expect(regenerateRecoveryCodes).toHaveBeenCalledWith({ code: '123456' }),
    );
    expectHeldOpen(dialog);

    regenerating.resolve({
      error: null,
      data: { recoveryCodes: ['aaaa-bbbb'] },
    });
    expect(
      await screen.findByRole('dialog', { name: 'New Recovery Codes' }),
    ).toHaveTextContent('aaaa-bbbb');
  });
});
