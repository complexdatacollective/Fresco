import { describe, expect, it } from 'vitest';
import {
  getPasswordStrength,
  type PasswordStrength,
} from '~/app/(blobs)/(setup)/_components/getPasswordStrength';

describe('getPasswordStrength', () => {
  it('returns score 0 for empty string', () => {
    const result = getPasswordStrength('');
    expect(result).toEqual<PasswordStrength>({
      score: 0,
      label: null,
      percent: 0,
      colorClass: null,
    });
  });

  it('returns score 1 (Weak) for short passwords', () => {
    const result = getPasswordStrength('abc');
    expect(result.score).toBe(1);
    expect(result.label).toBe('Weak');
    expect(result.percent).toBe(25);
    expect(result.colorClass).toBe('text-destructive');
  });

  it('returns score 1 (Weak) for long password with only 1 character class', () => {
    const result = getPasswordStrength('abcdefghijklmnop');
    expect(result.score).toBe(1);
    expect(result.label).toBe('Weak');
  });

  it('returns score 2 (Fair) for 8+ chars with 2 character classes', () => {
    const result = getPasswordStrength('abcdefg1');
    expect(result.score).toBe(2);
    expect(result.label).toBe('Fair');
    expect(result.percent).toBe(50);
    expect(result.colorClass).toBe('text-warning');
  });

  it('returns score 3 (Good) for 8+ chars with 3 character classes', () => {
    const result = getPasswordStrength('abcdeG1!');
    expect(result.score).toBe(3);
    expect(result.label).toBe('Good');
    expect(result.percent).toBe(75);
    expect(result.colorClass).toBe('text-success');
  });

  it('returns score 4 (Strong) for 12+ chars with all 4 character classes', () => {
    const result = getPasswordStrength('abcdefG1!xyz');
    expect(result.score).toBe(4);
    expect(result.label).toBe('Strong');
    expect(result.percent).toBe(100);
    expect(result.colorClass).toBe('text-success');
  });

  it('returns score 2 when 12+ chars but only 2 classes', () => {
    const result = getPasswordStrength('abcdefghij12');
    expect(result.score).toBe(2);
  });

  it('returns score 3 when 12+ chars with 3 classes (not all 4)', () => {
    const result = getPasswordStrength('abcdefghiJ12');
    expect(result.score).toBe(3);
  });
});
