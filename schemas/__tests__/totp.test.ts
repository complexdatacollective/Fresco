import { describe, expect, it } from 'vitest';
import {
  disableTotpSchema,
  verifyTotpSetupSchema,
  verifyTwoFactorSchema,
} from '../totp';

describe('TOTP Schema Validators', () => {
  describe('verifyTotpSetupSchema', () => {
    it('accepts a valid 6-digit numeric code', () => {
      const result = verifyTotpSetupSchema.parse({ code: '123456' });
      expect(result.code).toBe('123456');
    });

    it('rejects a code containing non-numeric characters', () => {
      expect(() => verifyTotpSetupSchema.parse({ code: '12345a' })).toThrow();
    });

    it('rejects a code shorter than 6 digits', () => {
      expect(() => verifyTotpSetupSchema.parse({ code: '12345' })).toThrow();
    });

    it('rejects a code longer than 6 digits', () => {
      expect(() => verifyTotpSetupSchema.parse({ code: '1234567' })).toThrow();
    });

    it('rejects when code is omitted because the prefault empty string fails length validation', () => {
      expect(() => verifyTotpSetupSchema.parse({})).toThrow();
    });
  });

  describe('verifyTwoFactorSchema', () => {
    it('accepts valid twoFactorToken and code values', () => {
      const result = verifyTwoFactorSchema.parse({
        twoFactorToken: 'token-abc',
        code: '654321',
      });
      expect(result.twoFactorToken).toBe('token-abc');
      expect(result.code).toBe('654321');
    });

    it('rejects an empty twoFactorToken', () => {
      expect(() =>
        verifyTwoFactorSchema.parse({ twoFactorToken: '', code: '123456' }),
      ).toThrow();
    });

    it('rejects an empty code', () => {
      expect(() =>
        verifyTwoFactorSchema.parse({
          twoFactorToken: 'token-abc',
          code: '',
        }),
      ).toThrow();
    });

    it('rejects when code is omitted because the prefault empty string fails min(1) validation', () => {
      expect(() =>
        verifyTwoFactorSchema.parse({ twoFactorToken: 'token-abc' }),
      ).toThrow();
    });
  });

  describe('disableTotpSchema', () => {
    it('accepts a valid 6-digit numeric code', () => {
      const result = disableTotpSchema.parse({ code: '987654' });
      expect(result.code).toBe('987654');
    });

    it('rejects a code containing non-numeric characters', () => {
      expect(() => disableTotpSchema.parse({ code: 'abc123' })).toThrow();
    });

    it('rejects a code that is not 6 digits long', () => {
      expect(() => disableTotpSchema.parse({ code: '12345' })).toThrow();
      expect(() => disableTotpSchema.parse({ code: '1234567' })).toThrow();
    });

    it('rejects when code is omitted because the prefault empty string fails length validation', () => {
      expect(() => disableTotpSchema.parse({})).toThrow();
    });
  });
});
