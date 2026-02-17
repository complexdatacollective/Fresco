import { describe, expect, it } from 'vitest';
import { type FieldValue } from '../../store/types';
import compareVariables from './compareVariables';

describe('compareVariables', () => {
  describe('null/undefined value handling', () => {
    it('should return 0 when both values are undefined', () => {
      expect(compareVariables(undefined, undefined, 'number')).toBe(0);
    });

    it('should return -1 when first value is undefined', () => {
      expect(compareVariables(undefined, 10, 'number')).toBe(-1);
    });

    it('should return 1 when second value is undefined', () => {
      expect(compareVariables(10, undefined as FieldValue, 'number')).toBe(1);
    });
  });

  describe('boolean comparison', () => {
    it('should return 1 when true compared to false', () => {
      expect(compareVariables(true, false, 'boolean')).toBe(1);
    });

    it('should return -1 when false compared to true', () => {
      expect(compareVariables(false, true, 'boolean')).toBe(-1);
    });
  });

  describe('datetime comparison', () => {
    it('should return positive when first date is later', () => {
      expect(
        compareVariables(
          '2024-06-01T00:00:00Z',
          '2024-01-01T00:00:00Z',
          'datetime',
        ),
      ).toBeGreaterThan(0);
    });

    it('should return negative when first date is earlier', () => {
      expect(
        compareVariables(
          '2024-01-01T00:00:00Z',
          '2024-06-01T00:00:00Z',
          'datetime',
        ),
      ).toBeLessThan(0);
    });

    it('should return 0 when dates are equal', () => {
      expect(
        compareVariables(
          '2024-01-01T00:00:00Z',
          '2024-01-01T00:00:00Z',
          'datetime',
        ),
      ).toBe(0);
    });
  });

  describe('numeric type coercion (form string inputs)', () => {
    it('should compare string "5" less than number 10 for number type', () => {
      expect(compareVariables('5', 10, 'number')).toBeLessThan(0);
    });

    it('should compare string "15" greater than number 10 for number type', () => {
      expect(compareVariables('15', 10, 'number')).toBeGreaterThan(0);
    });

    it('should compare string "10" equal to number 10 for number type', () => {
      expect(compareVariables('10', 10, 'number')).toBe(0);
    });

    it('should compare two string numbers correctly for number type', () => {
      // This was the original bug: "14" < "4" lexicographically
      expect(compareVariables('14', '4', 'number')).toBeGreaterThan(0);
    });

    it('should handle decimal string numbers for number type', () => {
      expect(compareVariables('3.14', '2.71', 'number')).toBeGreaterThan(0);
    });

    it('should handle scalar type with numeric strings', () => {
      expect(compareVariables('0.5', 0.3, 'scalar')).toBeGreaterThan(0);
      expect(compareVariables('0.2', '0.8', 'scalar')).toBeLessThan(0);
    });

    it('should handle ordinal type with numeric strings', () => {
      expect(compareVariables('2', 3, 'ordinal')).toBeLessThan(0);
      expect(compareVariables('5', '2', 'ordinal')).toBeGreaterThan(0);
    });

    it('should fall through to string comparison for non-numeric strings with number type', () => {
      // "abc" becomes NaN, so falls through to string comparison
      expect(compareVariables('abc', 'def', 'number')).toBeLessThan(0);
    });
  });

  describe('pure number comparison', () => {
    it('should return positive when first number is greater', () => {
      expect(compareVariables(15, 10, 'number')).toBeGreaterThan(0);
    });

    it('should return negative when first number is smaller', () => {
      expect(compareVariables(5, 10, 'number')).toBeLessThan(0);
    });

    it('should return 0 when numbers are equal', () => {
      expect(compareVariables(10, 10, 'number')).toBe(0);
    });
  });

  describe('string comparison', () => {
    it('should use localeCompare for text type', () => {
      expect(compareVariables('apple', 'banana', 'text')).toBeLessThan(0);
      expect(compareVariables('zebra', 'apple', 'text')).toBeGreaterThan(0);
      expect(compareVariables('same', 'same', 'text')).toBe(0);
    });
  });

  describe('object comparison', () => {
    it('should compare objects by JSON string', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 3 };
      // JSON.stringify comparison
      expect(compareVariables(obj1, obj2, 'categorical')).not.toBe(0);
    });
  });
});
