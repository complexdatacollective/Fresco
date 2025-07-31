import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validateFieldValue, debounce } from '../utils/validation';
import type { ValidationContext } from '../types';

describe('Validation Utils', () => {
  const mockContext: ValidationContext = {
    formContext: {},
    fieldContext: {},
    formValues: {},
  };

  describe('validateFieldValue', () => {
    it('should return valid for no validation', async () => {
      const result = await validateFieldValue('test', undefined, mockContext);

      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should validate with Zod schema', async () => {
      const schema = z.string().min(3, 'Too short');

      // Valid case
      const validResult = await validateFieldValue(
        'hello',
        schema,
        mockContext,
      );
      expect(validResult.isValid).toBe(true);
      expect(validResult.error).toBe(null);

      // Invalid case
      const invalidResult = await validateFieldValue('hi', schema, mockContext);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toBe('Too short');
    });

    it('should validate with function returning schema', async () => {
      const validationFn = (_context: ValidationContext) => {
        return z.string().email('Invalid email');
      };

      // Valid case
      const validResult = await validateFieldValue(
        'test@example.com',
        validationFn,
        mockContext,
      );
      expect(validResult.isValid).toBe(true);
      expect(validResult.error).toBe(null);

      // Invalid case
      const invalidResult = await validateFieldValue(
        'invalid-email',
        validationFn,
        mockContext,
      );
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toBe('Invalid email');
    });

    it('should validate with async function returning schema', async () => {
      const asyncValidationFn = async (_context: ValidationContext) => {
        // Simulate async operation
        await new Promise((resolve) => setTimeout(resolve, 10));
        return z.string().min(5, 'Too short');
      };

      // Valid case
      const validResult = await validateFieldValue(
        'hello',
        asyncValidationFn,
        mockContext,
      );
      expect(validResult.isValid).toBe(true);
      expect(validResult.error).toBe(null);

      // Invalid case
      const invalidResult = await validateFieldValue(
        'hi',
        asyncValidationFn,
        mockContext,
      );
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toBe('Too short');
    });

    it('should handle validation errors gracefully', async () => {
      const errorValidationFn = () => {
        throw new Error('Validation function error');
      };

      const result = await validateFieldValue(
        'test',
        errorValidationFn,
        mockContext,
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Validation error');
    });

    it('should use context in validation', async () => {
      const contextValidationFn = (context: ValidationContext) => {
        const minLength = (context.formContext?.minLength as number) ?? 3;
        return z.string().min(minLength, `Must be at least ${minLength} chars`);
      };

      const contextWithMinLength: ValidationContext = {
        ...mockContext,
        formContext: { minLength: 5 },
      };

      const result = await validateFieldValue(
        'hi',
        contextValidationFn,
        contextWithMinLength,
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Must be at least 5 chars');
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      let callCount = 0;
      const fn = () => {
        callCount++;
      };
      const debouncedFn = debounce(fn, 50);

      // Call multiple times quickly
      debouncedFn();
      debouncedFn();
      debouncedFn();

      // Should not have been called yet
      expect(callCount).toBe(0);

      // Wait for debounce delay
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Should have been called only once
      expect(callCount).toBe(1);
    });

    it('should pass arguments to debounced function', async () => {
      let lastArgs: unknown[] = [];
      const fn = (...args: unknown[]) => {
        lastArgs = args;
      };
      const debouncedFn = debounce(fn, 50);

      debouncedFn('arg1', 'arg2', 'arg3');

      await new Promise((resolve) => setTimeout(resolve, 60));

      expect(lastArgs).toEqual(['arg1', 'arg2', 'arg3']);
    });

    it('should cancel previous calls when called again', async () => {
      let callCount = 0;
      const fn = () => {
        callCount++;
      };
      const debouncedFn = debounce(fn, 50);

      debouncedFn();

      // Call again before first delay expires
      setTimeout(() => debouncedFn(), 25);

      // Wait for both delays
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should have been called only once (the second call)
      expect(callCount).toBe(1);
    });
  });
});
