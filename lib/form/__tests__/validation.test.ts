import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { ValidationContext } from '../types';
import { validateFieldValue } from '../utils/validation';

describe('Validation Utils', () => {
  const mockContext: ValidationContext = {
    codebook: {} as any,
    formValues: {},
    network: {} as any,
  };

  describe('validateFieldValue', () => {
    it('should return valid for no validation', async () => {
      const result = await validateFieldValue('test', undefined, mockContext);

      expect(result.isValid).toBe(true);
      expect(result.errors).toBe(null);
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
      expect(validResult.errors).toBe(null);

      // Invalid case
      const invalidResult = await validateFieldValue('hi', schema, mockContext);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toEqual(['Too short']);
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
      expect(validResult.errors).toBe(null);

      // Invalid case
      const invalidResult = await validateFieldValue(
        'invalid-email',
        validationFn,
        mockContext,
      );
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toEqual(['Invalid email']);
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
      expect(validResult.errors).toBe(null);

      // Invalid case
      const invalidResult = await validateFieldValue(
        'hi',
        asyncValidationFn,
        mockContext,
      );
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toEqual(['Too short']);
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
      expect(result.errors).toEqual(['Validation error']);
    });

    it('should use context in validation', async () => {
      const contextValidationFn = (context: ValidationContext) => {
        const minLength =
          (context.codebook as { minLength?: number })?.minLength ?? 3;
        return z.string().min(minLength, `Must be at least ${minLength} chars`);
      };

      const contextWithMinLength: ValidationContext = {
        ...mockContext,
      };

      const result = await validateFieldValue(
        'hi',
        contextValidationFn,
        contextWithMinLength,
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(['Must be at least 5 chars']);
    });
  });
});
