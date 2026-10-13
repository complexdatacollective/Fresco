import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppI18nProvider } from '@codaco/app-i18n/react';
import { frescoLocales } from '~/i18n/locales';
import { frescoCatalogSource } from '~/src/locales/catalogs';

const { mockPush, mockStartTwoFactorSetup, mockUseTwoFactorSetup } = vi.hoisted(
  () => ({
    mockPush: vi.fn(),
    mockStartTwoFactorSetup: vi.fn(),
    mockUseTwoFactorSetup: vi.fn(),
  }),
);

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}));

vi.mock('~/components/TwoFactorSetup', () => ({
  useTwoFactorSetup: mockUseTwoFactorSetup,
}));

vi.mock('~/actions/auth', () => ({ logout: vi.fn() }));

import TwoFactorSetupPrompt from '../TwoFactorSetupPrompt';

// Loaded up front, so every render and formatter below has Spanish
// synchronously.
await frescoCatalogSource.load('es');

const view = (locale: string) => (
  <AppI18nProvider
    locale={locale}
    locales={frescoLocales}
    messages={frescoCatalogSource.peek(locale)}
  >
    <TwoFactorSetupPrompt username="alice" userCount={3} />
  </AppI18nProvider>
);

describe('TwoFactorSetupPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTwoFactorSetup.mockReturnValue(mockStartTwoFactorSetup);
  });

  it('opens the shared setup wizard for this account and continues to the dashboard once it completes', async () => {
    mockStartTwoFactorSetup.mockResolvedValue(true);
    render(view('en'));

    expect(screen.getByText('Signed in as alice')).toBeVisible();
    fireEvent.click(
      screen.getByRole('button', { name: 'Set up two-factor authentication' }),
    );

    expect(mockUseTwoFactorSetup).toHaveBeenCalledWith(3);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'));
  });

  it('stays put when the wizard is dismissed, so the gate is never bypassed', async () => {
    mockStartTwoFactorSetup.mockResolvedValue(false);
    render(view('en'));

    const button = screen.getByRole('button', {
      name: 'Set up two-factor authentication',
    });
    fireEvent.click(button);

    await waitFor(() => expect(mockStartTwoFactorSetup).toHaveBeenCalled());
    await waitFor(() => expect(button).toBeEnabled());
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('offers a way to sign out instead', () => {
    render(view('en'));

    expect(screen.getByRole('button', { name: 'Sign out' })).toBeVisible();
  });

  it('renders the Spanish prompt', () => {
    render(view('es'));

    expect(
      screen.getByRole('button', {
        name: 'Configurar la autenticación de dos factores',
      }),
    ).toBeVisible();
    expect(screen.getByText('Sesión iniciada como alice')).toBeVisible();
  });
});
