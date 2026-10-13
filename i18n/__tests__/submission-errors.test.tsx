import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMessageError, defineMessage } from '@codaco/app-i18n/messages';
import { AppI18nProvider } from '@codaco/app-i18n/react';
import { SignInForm } from '~/app/(blobs)/(setup)/_components/SignInForm';
import { frescoLocales } from '~/i18n/locales';
import { createAuthSchemas } from '~/schemas/auth';
import { frescoCatalogSource } from '~/src/locales/catalogs';

const { login } = vi.hoisted(() => ({ login: vi.fn() }));
vi.mock('~/actions/auth', () => ({ login, recoveryCodeLogin: vi.fn() }));
vi.mock('~/actions/twoFactor', () => ({ verifyTwoFactor: vi.fn() }));
vi.mock('~/actions/webauthn', () => ({
  generateAuthenticationOptions: vi.fn(),
  verifyAuthentication: vi.fn(),
}));
vi.mock('@simplewebauthn/browser', () => ({
  browserSupportsWebAuthn: () => false,
  startAuthentication: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const incorrectCredentials = defineMessage({
  id: 'fresco.actions.auth.copyIncorrectUsernameOrPassword',
  defaultMessage: 'Incorrect username or password',
  description: 'Authentication error returned by the real login action.',
});
// Loaded up front, so every render and formatter below has Spanish
// synchronously.
await frescoCatalogSource.load('es');

const view = (locale: string) => (
  <AppI18nProvider
    locale={locale}
    locales={frescoLocales}
    messages={frescoCatalogSource.peek(locale)}
  >
    <SignInForm />
  </AppI18nProvider>
);

beforeEach(() => vi.clearAllMocks());

describe('Fresco active submitted errors', () => {
  it('retranslates the displayed credential error without resubmitting or clearing entered fields', async () => {
    login.mockResolvedValue({
      success: false,
      formErrors: [createMessageError(incorrectCredentials)],
    });
    const { rerender } = render(view('es'));
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Nombre de usuario' }),
      { target: { value: 'alice' } },
    );
    fireEvent.change(screen.getByLabelText('Contraseña', { exact: true }), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(
      await screen.findByText('Nombre de usuario o contraseña incorrectos'),
    ).toBeVisible();
    rerender(view('en'));
    expect(screen.getByText('Incorrect username or password')).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Username' })).toHaveValue(
      'alice',
    );
    expect(screen.getByLabelText('Password', { exact: true })).toHaveValue(
      'wrong-password',
    );
    expect(login).toHaveBeenCalledTimes(1);
  });

  it('retranslates server field validation and retains the field error association', async () => {
    const parsed = createAuthSchemas(createMessageError).loginSchema.safeParse({
      username: '',
      password: 'value',
    });
    if (parsed.success)
      throw new Error('Expected the deliberately invalid server input to fail');
    const message = parsed.error.issues.find(
      ({ path }) => path[0] === 'username',
    )?.message;
    if (!message) throw new Error('Expected a username field error');
    login.mockResolvedValue({
      success: false,
      fieldErrors: { username: [message] },
    });
    const { rerender } = render(view('en'));
    fireEvent.change(screen.getByRole('textbox', { name: 'Username' }), {
      target: { value: 'alice' },
    });
    fireEvent.change(screen.getByLabelText('Password', { exact: true }), {
      target: { value: 'value' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Username cannot be empty')).toBeVisible();
    rerender(view('es'));
    expect(
      screen.getByText('El nombre de usuario no puede estar vacío'),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        screen.getByRole('textbox', { name: 'Nombre de usuario' }),
      ).toHaveAttribute('aria-invalid', 'true'),
    );
    expect(login).toHaveBeenCalledTimes(1);
  });
});
