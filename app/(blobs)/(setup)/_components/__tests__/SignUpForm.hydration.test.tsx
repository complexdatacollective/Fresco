import { within } from '@testing-library/react';
import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FrescoI18nProvider } from '~/i18n/FrescoI18nProvider';
import { frescoCatalogSource } from '~/src/locales/catalogs';

const { mockBrowserSupportsWebAuthn } = vi.hoisted(() => ({
  mockBrowserSupportsWebAuthn: vi.fn(() => true),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@simplewebauthn/browser', () => ({
  browserSupportsWebAuthn: mockBrowserSupportsWebAuthn,
  startRegistration: vi.fn(),
}));

vi.mock('~/actions/auth', () => ({ signup: vi.fn() }));
vi.mock('~/actions/locale', () => ({ updateLocale: vi.fn() }));
vi.mock('~/actions/webauthn', () => ({
  signupWithPasskey: vi.fn(),
  generateSignupRegistrationOptions: vi.fn(),
}));
// The auth-method choice only lays itself out differently by viewport; pin it
// so the two render passes cannot differ for a reason unrelated to hydration.
vi.mock('usehooks-ts', () => ({ useMediaQuery: () => false }));

import { SignUpForm } from '../SignUpForm';

// What the root layout delivers with an English request.
const messages = await frescoCatalogSource.load('en');

const view = (
  <FrescoI18nProvider
    initial={{
      locale: 'en',
      preference: null,
      userId: null,
      requested: ['en'],
    }}
    messages={messages}
  >
    <SignUpForm />
  </FrescoI18nProvider>
);

const authMethodChoice = (container: HTMLElement) =>
  within(container).queryByText('Authentication method');

const containers: HTMLElement[] = [];

const serverRenderInto = () => {
  const container = document.createElement('div');
  container.innerHTML = renderToString(view);
  document.body.append(container);
  containers.push(container);
  return container;
};

afterEach(() => {
  for (const container of containers.splice(0)) {
    container.remove();
  }
  mockBrowserSupportsWebAuthn.mockClear();
});

describe('SignUpForm passkey capability detection', () => {
  it('leaves the auth-method choice out of the server markup, without asking the browser', () => {
    // The server has no WebAuthn API. An ungated capability read would call it
    // during the server render and put the passkey choice into markup the
    // hydrating client render then has to disagree with.
    const container = serverRenderInto();

    expect(mockBrowserSupportsWebAuthn).not.toHaveBeenCalled();
    expect(authMethodChoice(container)).toBeNull();
    expect(within(container).queryByText('Passkey')).toBeNull();
  });

  it('offers the auth-method choice after hydration, with no mismatch', async () => {
    const container = serverRenderInto();
    expect(authMethodChoice(container)).toBeNull();

    const onRecoverableError = vi.fn();
    const root = hydrateRoot(container, view, { onRecoverableError });
    await act(async () => {});

    // React recovers from a hydration mismatch by re-rendering, so the value
    // below could read correctly while the behaviour being guarded was broken.
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(mockBrowserSupportsWebAuthn).toHaveBeenCalled();
    expect(authMethodChoice(container)).not.toBeNull();

    await act(async () => root.unmount());
  });

  it('keeps the auth-method choice hidden after hydration when the browser lacks WebAuthn', async () => {
    mockBrowserSupportsWebAuthn.mockReturnValue(false);
    const container = serverRenderInto();

    const onRecoverableError = vi.fn();
    const root = hydrateRoot(container, view, { onRecoverableError });
    await act(async () => {});

    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(authMethodChoice(container)).toBeNull();

    await act(async () => root.unmount());
    mockBrowserSupportsWebAuthn.mockReturnValue(true);
  });
});
