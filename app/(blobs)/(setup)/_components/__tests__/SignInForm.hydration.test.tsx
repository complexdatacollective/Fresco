import { within } from '@testing-library/react';
import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppI18nProvider } from '@codaco/app-i18n/react';
import { frescoLocales } from '~/i18n/locales';

const { mockBrowserSupportsWebAuthn } = vi.hoisted(() => ({
  mockBrowserSupportsWebAuthn: vi.fn(() => true),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@simplewebauthn/browser', () => ({
  browserSupportsWebAuthn: mockBrowserSupportsWebAuthn,
  startAuthentication: vi.fn(),
}));

vi.mock('~/actions/auth', () => ({
  login: vi.fn(),
  recoveryCodeLogin: vi.fn(),
}));

vi.mock('~/actions/twoFactor', () => ({ verifyTwoFactor: vi.fn() }));

vi.mock('~/actions/webauthn', () => ({
  generateAuthenticationOptions: vi.fn(),
  verifyAuthentication: vi.fn(),
}));

import { SignInForm } from '../SignInForm';

const view = (
  <AppI18nProvider locale="en" locales={frescoLocales}>
    <SignInForm />
  </AppI18nProvider>
);

const passkeyButton = (container: HTMLElement) =>
  within(container).queryByRole('button', { name: 'Sign in with a passkey' });

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

describe('SignInForm passkey capability detection', () => {
  it('leaves the passkey option out of the server markup, without asking the browser', () => {
    // The server has no WebAuthn API at all. If the capability read were not
    // gated on hydration this call would happen during the server render — and
    // the markup would already offer the passkey button, which the hydrating
    // client render then has to disagree with.
    const container = serverRenderInto();

    expect(mockBrowserSupportsWebAuthn).not.toHaveBeenCalled();
    expect(passkeyButton(container)).toBeNull();
  });

  it('offers the passkey option after hydration, with no mismatch', async () => {
    const container = serverRenderInto();
    expect(passkeyButton(container)).toBeNull();

    const onRecoverableError = vi.fn();
    const root = hydrateRoot(container, view, { onRecoverableError });
    await act(async () => {});

    // A hydration mismatch here would mean the client render disagreed with
    // the server markup — React recovers by re-rendering, so the value below
    // could still be right while the behaviour being guarded was broken.
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(mockBrowserSupportsWebAuthn).toHaveBeenCalled();
    expect(passkeyButton(container)).not.toBeNull();

    await act(async () => root.unmount());
  });

  it('keeps the passkey option hidden after hydration when the browser lacks WebAuthn', async () => {
    mockBrowserSupportsWebAuthn.mockReturnValue(false);
    const container = serverRenderInto();

    const onRecoverableError = vi.fn();
    const root = hydrateRoot(container, view, { onRecoverableError });
    await act(async () => {});

    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(passkeyButton(container)).toBeNull();

    await act(async () => root.unmount());
    mockBrowserSupportsWebAuthn.mockReturnValue(true);
  });
});
