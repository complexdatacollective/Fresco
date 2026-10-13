import type { RegistrationResponseJSON } from '@simplewebauthn/browser';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SignUpForm } from '~/app/(blobs)/(setup)/_components/SignUpForm';
import { FrescoI18nProvider } from '~/i18n/FrescoI18nProvider';
import FrescoLocaleSwitcher from '~/i18n/FrescoLocaleSwitcher';
import { frescoCatalogSource } from '~/src/locales/catalogs';

const { signup, signupWithPasskey, startRegistration, updateLocale, router } =
  vi.hoisted(() => ({
    signup: vi.fn(),
    signupWithPasskey: vi.fn(),
    startRegistration: vi.fn(),
    updateLocale: vi.fn(),
    router: { refresh: vi.fn(), push: vi.fn() },
  }));
vi.mock('~/actions/auth', () => ({ signup }));
vi.mock('~/actions/locale', () => ({ updateLocale }));
vi.mock('~/actions/webauthn', () => ({
  signupWithPasskey,
  generateSignupRegistrationOptions: async () => ({
    error: null,
    data: { options: {} },
  }),
}));
vi.mock('@simplewebauthn/browser', () => ({
  browserSupportsWebAuthn: () => true,
  startRegistration,
}));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('usehooks-ts', () => ({ useMediaQuery: () => false }));

// The request's catalog, as the root layout delivers it, and Spanish loaded up
// front so choosing it changes the form's language immediately.
const en = await frescoCatalogSource.load('en');
await frescoCatalogSource.load('es');

const chooseLanguage = async (name: RegExp) => {
  fireEvent.click(
    screen.getByRole('combobox', {
      name: /^(Interface language|Idioma de la interfaz):/,
    }),
  );
  const popover = await screen.findByRole('dialog');
  fireEvent.click(screen.getByRole('option', { name }));
  await waitFor(() => expect(popover).not.toBeInTheDocument());
};

function View({ password = false }: { password?: boolean }) {
  return (
    <FrescoI18nProvider
      initial={{
        locale: 'en',
        preference: null,
        userId: null,
        requested: ['en'],
      }}
      messages={en}
    >
      <FrescoLocaleSwitcher />
      <SignUpForm sandboxMode={password} />
    </FrescoI18nProvider>
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  signup.mockResolvedValue({ success: false, error: null });
  signupWithPasskey.mockResolvedValue({ error: null, data: {} });
  updateLocale.mockResolvedValue({ success: true });
  Object.defineProperty(navigator, 'languages', {
    configurable: true,
    value: ['en'],
  });
});

describe('setup language across account creation', () => {
  it('passes the selected password-signup preference before its mirror write completes', async () => {
    updateLocale.mockReturnValue(new Promise(() => undefined));
    const view = render(<View password />);
    await chooseLanguage(/^Español$/);
    fireEvent.change(view.container.querySelector('input[name="username"]')!, {
      target: { value: 'Researcher' },
    });
    fireEvent.change(view.container.querySelector('input[name="password"]')!, {
      target: { value: 'Sup3rSecret!' },
    });
    await waitFor(() =>
      expect(
        view.container.querySelector('input[name="confirmPassword"]'),
      ).not.toBeNull(),
    );
    fireEvent.change(
      view.container.querySelector('input[name="confirmPassword"]')!,
      { target: { value: 'Sup3rSecret!' } },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    await waitFor(() =>
      expect(signup).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'Researcher' }),
        'es',
      ),
    );
  });

  it.each(['es', 'automatic'])(
    'uses the latest committed preference %s after the passkey prompt resolves',
    async (choice) => {
      let resolveRegistration!: (credential: RegistrationResponseJSON) => void;
      startRegistration.mockReturnValue(
        new Promise<RegistrationResponseJSON>((resolve) => {
          resolveRegistration = resolve;
        }),
      );
      const view = render(<View />);
      await waitFor(() =>
        expect(
          view.container.querySelector('input[name="password"]'),
        ).toBeNull(),
      );
      fireEvent.change(
        view.container.querySelector('input[name="username"]')!,
        { target: { value: 'Researcher' } },
      );
      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
      await waitFor(() => expect(startRegistration).toHaveBeenCalledOnce());
      await chooseLanguage(/^Español$/);
      if (choice === 'automatic') await chooseLanguage(/^Automático/);
      await act(async () =>
        resolveRegistration({
          id: 'credential',
          rawId: 'credential',
          type: 'public-key',
          response: { clientDataJSON: 'fixture', attestationObject: 'fixture' },
          clientExtensionResults: {},
        }),
      );
      await waitFor(() =>
        expect(signupWithPasskey).toHaveBeenCalledWith(
          expect.objectContaining({
            username: 'Researcher',
            locale: choice === 'es' ? 'es' : null,
          }),
        ),
      );
    },
  );
});
