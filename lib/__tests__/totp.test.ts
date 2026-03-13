import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { Secret, TOTP } from 'otpauth';
import {
  createTwoFactorToken,
  generateQrCodeDataUrl,
  generateRecoveryCodes,
  generateTotpSecret,
  generateTotpUri,
  hashRecoveryCode,
  verifyTotpCode,
  verifyTwoFactorToken,
} from '~/lib/totp';

describe('generateTotpSecret', () => {
  it('returns a non-empty string', () => {
    const secret = generateTotpSecret();
    expect(typeof secret).toBe('string');
    expect(secret.length).toBeGreaterThan(0);
  });

  it('returns a valid base32 string', () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]+=*$/);
  });

  it('returns a unique secret on each call', () => {
    const secret1 = generateTotpSecret();
    const secret2 = generateTotpSecret();
    expect(secret1).not.toBe(secret2);
  });
});

describe('generateTotpUri', () => {
  it('returns a string starting with otpauth://totp/', () => {
    const secret = generateTotpSecret();
    const uri = generateTotpUri(secret, 'testuser', 'Fresco (localhost)');
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
  });

  it('contains the issuer Fresco', () => {
    const secret = generateTotpSecret();
    const uri = generateTotpUri(secret, 'testuser', 'Fresco (localhost)');
    expect(uri).toContain('Fresco');
  });

  it('contains the username in the label', () => {
    const secret = generateTotpSecret();
    const username = 'alice@example.com';
    const uri = generateTotpUri(secret, username, 'Fresco (localhost)');
    expect(uri).toContain(encodeURIComponent(username));
  });
});

describe('verifyTotpCode', () => {
  it('returns true for a valid code generated from the same secret', () => {
    const secret = new Secret();
    const totp = new TOTP({ issuer: 'Fresco', secret });
    const validCode = totp.generate();
    expect(verifyTotpCode(secret.base32, validCode)).toBe(true);
  });

  it('returns false for an incorrect code', () => {
    const secret = generateTotpSecret();
    expect(verifyTotpCode(secret, '000000')).toBe(false);
  });

  it('returns false for an empty string', () => {
    const secret = generateTotpSecret();
    expect(verifyTotpCode(secret, '')).toBe(false);
  });
});

describe('generateRecoveryCodes', () => {
  it('returns exactly 10 codes', () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(10);
  });

  it('each code is 20 hex characters (10 bytes as hex)', () => {
    const codes = generateRecoveryCodes();
    for (const code of codes) {
      expect(code).toMatch(/^[0-9a-f]{20}$/);
    }
  });

  it('all codes are unique', () => {
    const codes = generateRecoveryCodes();
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });
});

describe('hashRecoveryCode', () => {
  it('returns a 64-character hex string (SHA-256)', () => {
    const hash = hashRecoveryCode('somerecoverycode');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('same input produces the same hash', () => {
    const code = 'a1b2c3d4e5';
    const hash1 = hashRecoveryCode(code);
    const hash2 = hashRecoveryCode(code);
    expect(hash1).toBe(hash2);
  });

  it('different inputs produce different hashes', () => {
    const hash1 = hashRecoveryCode('code-one');
    const hash2 = hashRecoveryCode('code-two');
    expect(hash1).not.toBe(hash2);
  });
});

describe('createTwoFactorToken and verifyTwoFactorToken', () => {
  const installationId = 'test-installation-id';

  afterEach(() => {
    vi.useRealTimers();
  });

  it('created token can be verified and returns the correct userId', () => {
    const userId = 'user-abc-123';
    const token = createTwoFactorToken(userId, installationId);
    const result = verifyTwoFactorToken(token, installationId);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.userId).toBe(userId);
    }
  });

  it('tampered signature returns { valid: false }', () => {
    const token = createTwoFactorToken('user-123', installationId);
    const separatorIndex = token.lastIndexOf(':');
    const payloadEncoded = token.slice(0, separatorIndex);
    const tamperedToken = `${payloadEncoded}:invalidsignatureXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`;
    const result = verifyTwoFactorToken(tamperedToken, installationId);
    expect(result.valid).toBe(false);
  });

  it('tampered payload returns { valid: false }', () => {
    const token = createTwoFactorToken('user-123', installationId);
    const separatorIndex = token.lastIndexOf(':');
    const signature = token.slice(separatorIndex + 1);
    const tamperedPayload = Buffer.from('tampered:payload:data').toString(
      'base64url',
    );
    const tamperedToken = `${tamperedPayload}:${signature}`;
    const result = verifyTwoFactorToken(tamperedToken, installationId);
    expect(result.valid).toBe(false);
  });

  it('token missing separator returns { valid: false }', () => {
    const result = verifyTwoFactorToken(
      'tokenwithoutseparator',
      installationId,
    );
    expect(result.valid).toBe(false);
  });

  it('empty string returns { valid: false }', () => {
    const result = verifyTwoFactorToken('', installationId);
    expect(result.valid).toBe(false);
  });

  it('expired token returns { valid: false }', () => {
    vi.useFakeTimers();
    const userId = 'user-expired';
    const token = createTwoFactorToken(userId, installationId);

    // Advance time past the 5-minute TTL
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);

    const result = verifyTwoFactorToken(token, installationId);
    expect(result.valid).toBe(false);
  });

  it('token created with one installation ID fails verification with a different one', () => {
    const userId = 'user-cross-id';
    const token = createTwoFactorToken(userId, 'installation-a');
    const result = verifyTwoFactorToken(token, 'installation-b');
    expect(result.valid).toBe(false);
  });
});

describe('generateQrCodeDataUrl', () => {
  it('returns a data URL starting with data:image/png;base64,', async () => {
    const secret = generateTotpSecret();
    const uri = generateTotpUri(secret, 'testuser', 'Fresco (localhost)');
    const dataUrl = await generateQrCodeDataUrl(uri);
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });
});
