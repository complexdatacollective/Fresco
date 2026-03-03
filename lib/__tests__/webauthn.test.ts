import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(() => new Map([['origin', 'https://fresco.example.com']])),
}));

vi.mock('~/queries/appSettings', () => ({
  getInstallationId: vi.fn().mockResolvedValue('test-installation-id'),
}));

describe('getWebAuthnConfig', () => {
  it('derives rpID and origin from the origin header', async () => {
    const { getWebAuthnConfig } = await import('../webauthn');
    const config = await getWebAuthnConfig();
    expect(config.rpID).toBe('fresco.example.com');
    expect(config.rpName).toBe('Fresco');
    expect(config.origin).toBe('https://fresco.example.com');
  });
});

describe('challenge cookie', () => {
  it('creates and verifies a valid challenge cookie', async () => {
    const { createChallengeCookie, verifyChallengeCookie } =
      await import('../webauthn');
    const challenge = 'test-challenge-base64url';

    const cookieValue = await createChallengeCookie(challenge);
    expect(typeof cookieValue).toBe('string');

    const result = await verifyChallengeCookie(cookieValue);
    expect(result).toBe(challenge);
  });

  it('rejects a tampered challenge cookie', async () => {
    const { createChallengeCookie, verifyChallengeCookie } =
      await import('../webauthn');
    const challenge = 'test-challenge';

    const cookieValue = await createChallengeCookie(challenge);
    const tampered = 'tampered' + cookieValue;

    const result = await verifyChallengeCookie(tampered);
    expect(result).toBeNull();
  });

  it('rejects an expired challenge cookie', async () => {
    const { createChallengeCookie, verifyChallengeCookie } =
      await import('../webauthn');
    const challenge = 'test-challenge';

    const cookieValue = await createChallengeCookie(challenge);

    // Fast-forward time past the 5 minute TTL
    vi.useFakeTimers();
    vi.advanceTimersByTime(6 * 60 * 1000);

    const result = await verifyChallengeCookie(cookieValue);
    expect(result).toBeNull();

    vi.useRealTimers();
  });
});
