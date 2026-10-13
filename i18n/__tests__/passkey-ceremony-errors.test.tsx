import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createAppIntl,
  defineMessage,
  formatMessageError,
} from '@codaco/app-i18n/messages';
import { AppI18nProvider } from '@codaco/app-i18n/react';
import DialogProvider from '@codaco/fresco-ui/dialogs/DialogProvider';
import { SignInForm } from '~/app/(blobs)/(setup)/_components/SignInForm';
import PasskeySettings from '~/app/dashboard/settings/_components/PasskeySettings';
import { frescoLocales } from '~/i18n/locales';
import { describePasskeyCeremonyError } from '~/i18n/passkeyCeremony';
import { frescoCatalogSource } from '~/src/locales/catalogs';

const {
  startAuthentication,
  startRegistration,
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthentication,
  verifyRegistration,
} = vi.hoisted(() => ({
  startAuthentication: vi.fn(),
  startRegistration: vi.fn(),
  generateAuthenticationOptions: vi.fn(),
  generateRegistrationOptions: vi.fn(),
  verifyAuthentication: vi.fn(),
  verifyRegistration: vi.fn(),
}));
vi.mock('@simplewebauthn/browser', () => ({
  browserSupportsWebAuthn: () => true,
  startAuthentication,
  startRegistration,
}));
vi.mock('~/actions/auth', () => ({
  login: vi.fn(),
  recoveryCodeLogin: vi.fn(),
}));
vi.mock('~/actions/twoFactor', () => ({ verifyTwoFactor: vi.fn() }));
vi.mock('~/actions/webauthn', () => ({
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthentication,
  verifyRegistration,
  removePasskey: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

// @simplewebauthn/browser rethrows the browser's DOMException as an Error
// subclass that keeps the DOMException's name, which is all the callers read.
function ceremonyError(name: string): Error {
  return Object.assign(new Error(`${name} raised by the browser`), { name });
}

// Loaded up front, so every render and formatter below has Spanish
// synchronously.
await frescoCatalogSource.load('es');

function provide(locale: string, children: React.ReactNode) {
  return (
    <AppI18nProvider
      locale={locale}
      locales={frescoLocales}
      messages={frescoCatalogSource.peek(locale)}
    >
      <DialogProvider>{children}</DialogProvider>
    </AppI18nProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  generateAuthenticationOptions.mockResolvedValue({
    error: null,
    data: { options: {} },
  });
  generateRegistrationOptions.mockResolvedValue({
    error: null,
    data: { options: {} },
  });
});

describe('describePasskeyCeremonyError', () => {
  const fallback = defineMessage({
    id: 'fresco.test.callerFallback',
    defaultMessage: 'Caller fallback',
    description: 'Test-only stand-in for a caller’s generic failure message.',
  });
  const english = createAppIntl({ locale: 'en' });
  const guidance = (
    error: unknown,
    ceremony: 'signIn' | 'reauth' | 'registration',
  ) =>
    formatMessageError(
      describePasskeyCeremonyError(error, ceremony, fallback),
      english,
    );

  it.each([
    ['NotAllowedError', 'signIn', 'Passkey sign-in did not complete.'],
    ['NotAllowedError', 'reauth', 'Passkey check did not complete.'],
    ['NotAllowedError', 'registration', 'Passkey creation did not complete.'],
    [
      'ConstraintError',
      'registration',
      'This device or security key cannot create a Fresco passkey.',
    ],
  ] as const)('turns %s during %s into guidance', (name, ceremony, opening) => {
    expect(guidance(ceremonyError(name), ceremony)).toMatch(
      new RegExp(`^${opening.replace('.', '\\.')}`),
    );
  });

  it.each([
    [
      'ConstraintError outside registration',
      ceremonyError('ConstraintError'),
      'signIn',
    ],
    ['an unrelated error', new Error('network down'), 'registration'],
    ['a non-Error rejection', 'boom', 'signIn'],
  ] as const)('keeps the caller message for %s', (_label, error, ceremony) => {
    expect(guidance(error, ceremony)).toBe('Caller fallback');
  });
});

describe('passkey sign-in', () => {
  it('explains a prompt the browser closed without a credential', async () => {
    startAuthentication.mockRejectedValue(ceremonyError('NotAllowedError'));
    render(provide('en', <SignInForm />));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Sign in with a passkey' }),
    );
    expect(
      await screen.findByText(/^Passkey sign-in did not complete\./),
    ).toBeVisible();
    expect(verifyAuthentication).not.toHaveBeenCalled();
  });

  it('renders that guidance in Spanish', async () => {
    startAuthentication.mockRejectedValue(ceremonyError('NotAllowedError'));
    render(provide('es', <SignInForm />));
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Iniciar sesión con una llave de acceso',
      }),
    );
    expect(
      await screen.findByText(
        /^No se completó el inicio de sesión con llave de acceso\./,
      ),
    ).toBeVisible();
  });

  it('keeps the generic message for failures the browser did not classify', async () => {
    startAuthentication.mockRejectedValue(new Error('network down'));
    render(provide('en', <SignInForm />));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Sign in with a passkey' }),
    );
    expect(
      await screen.findByText('Passkey authentication failed'),
    ).toBeVisible();
  });
});

describe('adding a passkey', () => {
  const settings = (
    <PasskeySettings sandboxMode={false} hasPassword initialPasskeys={[]} />
  );

  it('names an authenticator that cannot create a Fresco passkey', async () => {
    startRegistration.mockRejectedValue(ceremonyError('ConstraintError'));
    render(provide('en', settings));
    fireEvent.click(screen.getByRole('button', { name: 'Add passkey' }));
    expect(
      await screen.findByText(
        /^This device or security key cannot create a Fresco passkey\./,
      ),
    ).toBeVisible();
    expect(verifyRegistration).not.toHaveBeenCalled();
  });

  it('explains a creation prompt the browser closed', async () => {
    startRegistration.mockRejectedValue(ceremonyError('NotAllowedError'));
    render(provide('en', settings));
    fireEvent.click(screen.getByRole('button', { name: 'Add passkey' }));
    expect(
      await screen.findByText(/^Passkey creation did not complete\./),
    ).toBeVisible();
  });
});
