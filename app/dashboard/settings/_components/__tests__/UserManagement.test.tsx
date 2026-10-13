import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppI18nProvider } from '@codaco/app-i18n/react';
import DialogProvider from '@codaco/fresco-ui/dialogs/DialogProvider';
import UserManagement from '~/app/dashboard/settings/_components/UserManagement';
import { frescoLocales } from '~/i18n/locales';
import { frescoCatalogSource } from '~/src/locales/catalogs';

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  changePassword: vi.fn(),
  checkUsernameAvailable: vi.fn(),
  createUser: vi.fn(),
  generateAuthenticationOptions: vi.fn(),
  generateRegistrationOptions: vi.fn(),
  verifyPasskeyReauth: vi.fn(),
  switchToPasswordMode: vi.fn(),
  startAuthentication: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock('~/actions/users', () => ({
  changePassword: mocks.changePassword,
  checkUsernameAvailable: mocks.checkUsernameAvailable,
  createUser: mocks.createUser,
  deleteUsers: vi.fn(),
}));
vi.mock('~/actions/webauthn', () => ({
  generateAuthenticationOptions: mocks.generateAuthenticationOptions,
  generateRegistrationOptions: mocks.generateRegistrationOptions,
  verifyPasskeyReauth: mocks.verifyPasskeyReauth,
  switchToPasswordMode: mocks.switchToPasswordMode,
  resetAuthForUser: vi.fn(),
  switchToPasskeyMode: vi.fn(),
  removePasskey: vi.fn(),
  verifyRegistration: vi.fn(),
}));
vi.mock('~/actions/totp', () => ({
  verifyCurrentUserTotp: vi.fn(),
  disableTotp: vi.fn(),
  regenerateRecoveryCodes: vi.fn(),
}));
vi.mock('~/components/TwoFactorSetup', () => ({
  useTwoFactorSetup: () => vi.fn(),
}));
vi.mock('@simplewebauthn/browser', () => ({
  startAuthentication: mocks.startAuthentication,
  startRegistration: vi.fn(),
}));

const PASSWORD = 'Correct-Horse-9-battery';

// The settings page streams its data in, so the first render is awaited.
const renderUserManagement = ({ hasPassword }: { hasPassword: boolean }) =>
  act(async () => {
    render(
      <AppI18nProvider
        locale="en"
        locales={frescoLocales}
        messages={frescoCatalogSource.peek('en')}
      >
        <NuqsTestingAdapter>
          <DialogProvider>
            <Suspense fallback={null}>
              <UserManagement
                usersPromise={Promise.resolve([
                  {
                    id: 'user-1',
                    username: 'alice',
                    totpCredential: null,
                    webAuthnCredentials: [],
                  },
                ])}
                currentUserId="user-1"
                currentUsername="alice"
                hasTwoFactorPromise={Promise.resolve(false)}
                passkeysPromise={Promise.resolve([])}
                hasPasswordPromise={Promise.resolve(hasPassword)}
                sandboxMode={false}
                twoFactorRequired={false}
              />
            </Suspense>
          </DialogProvider>
        </NuqsTestingAdapter>
      </AppI18nProvider>,
    );
  });

const openDialog = async (trigger: string, name: string) => {
  fireEvent.click(await screen.findByRole('button', { name: trigger }));
  return screen.findByRole('dialog', { name });
};

// Required fields mark their labels, so a label is matched by how it starts.
const fill = (dialog: HTMLElement, label: string, value: string) =>
  fireEvent.change(
    within(dialog).getByLabelText(new RegExp(`^${label}`), {
      selector: 'input',
    }),
    { target: { value } },
  );

const expectHeldOpen = (dialog: HTMLElement, { cancel = true } = {}) => {
  if (cancel) {
    expect(
      within(dialog).getByRole('button', { name: 'Cancel' }),
    ).toBeDisabled();
  }
  expect(
    within(dialog).queryByRole('button', { name: 'Close' }),
  ).not.toBeInTheDocument();
  fireEvent.keyDown(dialog, { key: 'Escape' });
  expect(dialog).toBeInTheDocument();
};

describe('UserManagement dialogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkUsernameAvailable.mockResolvedValue({ available: true });
  });

  it('holds the change password dialog open while the password changes', async () => {
    const change = Promise.withResolvers<unknown>();
    mocks.changePassword.mockReturnValue(change.promise);
    await renderUserManagement({ hasPassword: true });

    const dialog = await openDialog('Change Password', 'Change Password');
    fill(dialog, 'Current Password', 'old-password');
    fill(dialog, 'New Password', PASSWORD);
    fill(dialog, 'Confirm New Password', PASSWORD);
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Update Password' }),
    );

    await waitFor(() => expect(mocks.changePassword).toHaveBeenCalled());
    expectHeldOpen(dialog);

    change.resolve({ error: null, data: null });
    expect(
      await within(dialog).findByText('Password updated successfully!'),
    ).toBeVisible();
  });

  it('holds the add user dialog open while the user is created', async () => {
    const creation = Promise.withResolvers<unknown>();
    mocks.createUser.mockReturnValue(creation.promise);
    await renderUserManagement({ hasPassword: true });

    const dialog = await openDialog('Add User', 'Add User');
    fill(dialog, 'Username', 'bobby');
    fill(dialog, 'Password', PASSWORD);
    fill(dialog, 'Confirm Password', PASSWORD);
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Create User' }),
    );

    await waitFor(() => expect(mocks.createUser).toHaveBeenCalled());
    expectHeldOpen(dialog);

    creation.resolve({ error: null, data: null });
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  });

  it('holds the switch to passkey dialog open while the switch runs', async () => {
    const options = Promise.withResolvers<unknown>();
    mocks.generateRegistrationOptions.mockReturnValue(options.promise);
    await renderUserManagement({ hasPassword: true });

    const dialog = await openDialog(
      'Switch to Passkey',
      'Switch to Passkey Authentication',
    );
    fill(dialog, 'Current Password', 'old-password');
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Switch to Passkey' }),
    );

    await waitFor(() =>
      expect(mocks.generateRegistrationOptions).toHaveBeenCalled(),
    );
    expectHeldOpen(dialog);

    // Ending the submission hands the dialog back.
    options.resolve({ error: null, data: null });
    await waitFor(() =>
      expect(
        within(dialog).getByRole('button', { name: 'Cancel' }),
      ).toBeEnabled(),
    );
  });

  it('holds the switch to password dialog open through re-authentication and the switch', async () => {
    const reauth = Promise.withResolvers<unknown>();
    mocks.generateAuthenticationOptions.mockReturnValue(reauth.promise);
    mocks.startAuthentication.mockResolvedValue({ id: 'credential' });
    mocks.verifyPasskeyReauth.mockResolvedValue({ error: null, data: null });
    const switching = Promise.withResolvers<unknown>();
    mocks.switchToPasswordMode.mockReturnValue(switching.promise);
    await renderUserManagement({ hasPassword: false });

    const dialog = await openDialog(
      'Switch to Password',
      'Switch to Password Authentication',
    );
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Verify with passkey' }),
    );

    // The re-authentication step has no Cancel, only the dismissal routes.
    expect(
      await within(dialog).findByRole('button', { name: 'Verifying...' }),
    ).toBeDisabled();
    expectHeldOpen(dialog, { cancel: false });

    reauth.resolve({ error: null, data: { options: {} } });
    await within(dialog).findByLabelText(/^New Password/, {
      selector: 'input',
    });
    fill(dialog, 'New Password', PASSWORD);
    fill(dialog, 'Confirm New Password', PASSWORD);
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Switch to Password' }),
    );

    await waitFor(() =>
      expect(mocks.switchToPasswordMode).toHaveBeenCalledWith(PASSWORD),
    );
    expectHeldOpen(dialog);

    switching.resolve({ error: null, data: null });
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  });
});
