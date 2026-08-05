import { describe, expect, it } from 'vitest';

import {
  isStrongPassword,
  PASSWORD_CHARACTER_RULES,
  PASSWORD_MIN_LENGTH,
} from '~/utils/isStrongPassword';

// This rule is the single source of truth for password strength on both sides
// of the server boundary — `strongPasswordSchema` (server, standard zod) and
// UserManagement's form schema (client, zod/mini) are both built from it. These
// tests pin the rule itself so neither side can be weakened by accident.
describe('isStrongPassword', () => {
  it('accepts a password meeting every requirement', () => {
    expect(isStrongPassword('Passw0rd!')).toBe(true);
  });

  it('rejects a password shorter than the minimum length', () => {
    // Satisfies every character class, so length is the only thing failing.
    expect('Pa0!bcd'.length).toBeLessThan(PASSWORD_MIN_LENGTH);
    expect(isStrongPassword('Pa0!bcd')).toBe(false);
  });

  it.each([
    ['lowercase', 'PASSW0RD!'],
    ['uppercase', 'passw0rd!'],
    ['number', 'Password!'],
    ['symbol', 'Passw0rdd'],
  ])('rejects a password with no %s', (_requirement, password) => {
    expect(password.length).toBeGreaterThanOrEqual(PASSWORD_MIN_LENGTH);
    expect(isStrongPassword(password)).toBe(false);
  });

  it('rejects an empty password', () => {
    expect(isStrongPassword('')).toBe(false);
  });

  it('checks one character class per rule, each with its own message', () => {
    expect(PASSWORD_CHARACTER_RULES).toHaveLength(4);
    for (const { pattern, message } of PASSWORD_CHARACTER_RULES) {
      expect(pattern.test('Passw0rd!')).toBe(true);
      expect(message).toMatch(/^Password must contain at least 1 /);
    }
  });
});
