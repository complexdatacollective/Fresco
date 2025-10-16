import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { FieldValue } from '../types';
import { validateFieldValue } from '../utils/validation';

describe('Validation Utils', () => {
  const mockFormValues: Record<string, FieldValue> = {};

  describe('validateFieldValue', () => {
    it('should validate with no schema (passthrough)', async () => {
      // When no validation is provided, we can use z.unknown() which accepts anything
      const result = await validateFieldValue(
        'test',
        z.unknown(),
        mockFormValues,
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test');
      }
    });

    it('should validate with Zod schema', async () => {
      const schema = z.string().min(3, 'Too short');

      // Valid case
      const validResult = await validateFieldValue(
        'hello',
        schema,
        mockFormValues,
      );
      expect(validResult.success).toBe(true);
      if (validResult.success) {
        expect(validResult.data).toBe('hello');
      }

      // Invalid case
      const invalidResult = await validateFieldValue(
        'hi',
        schema,
        mockFormValues,
      );
      expect(invalidResult.success).toBe(false);
      if (!invalidResult.success) {
        expect(invalidResult.error.issues[0]?.message).toBe('Too short');
      }
    });

    it('should validate with function returning schema', async () => {
      const validationFn = (_formValues: Record<string, FieldValue>) => {
        return z.string().email({ message: 'Invalid email' });
      };

      // Valid case
      const validResult = await validateFieldValue(
        'test@example.com',
        validationFn,
        mockFormValues,
      );
      expect(validResult.success).toBe(true);
      if (validResult.success) {
        expect(validResult.data).toBe('test@example.com');
      }

      // Invalid case
      const invalidResult = await validateFieldValue(
        'invalid-email',
        validationFn,
        mockFormValues,
      );
      expect(invalidResult.success).toBe(false);
      if (!invalidResult.success) {
        expect(invalidResult.error.issues[0]?.message).toBe('Invalid email');
      }
    });

    it('should validate with async function returning schema', async () => {
      const asyncValidationFn = async (
        _formValues: Record<string, FieldValue>,
      ) => {
        // Simulate async operation
        await new Promise<void>((resolve) => setTimeout(resolve, 10));
        return z.string().min(5, 'Too short');
      };

      // Valid case
      const validResult = await validateFieldValue(
        'hello',
        asyncValidationFn,
        mockFormValues,
      );
      expect(validResult.success).toBe(true);
      if (validResult.success) {
        expect(validResult.data).toBe('hello');
      }

      // Invalid case
      const invalidResult = await validateFieldValue(
        'hi',
        asyncValidationFn,
        mockFormValues,
      );
      expect(invalidResult.success).toBe(false);
      if (!invalidResult.success) {
        expect(invalidResult.error.issues[0]?.message).toBe('Too short');
      }
    });

    it('should handle validation errors gracefully', async () => {
      const errorValidationFn = () => {
        throw new Error('Validation function error');
      };

      await expect(
        validateFieldValue('test', errorValidationFn, mockFormValues),
      ).rejects.toThrow('Validation function error');
    });

    it('should use formValues in validation', async () => {
      const formValueValidationFn = (
        formValues: Record<string, FieldValue>,
      ) => {
        const minLength =
          typeof formValues.minLength === 'number' ? formValues.minLength : 3;
        return z.string().min(minLength, `Must be at least ${minLength} chars`);
      };

      const formValuesWithMinLength: Record<string, FieldValue> = {
        minLength: 5,
      };

      const result = await validateFieldValue(
        'hi',
        formValueValidationFn,
        formValuesWithMinLength,
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'Must be at least 5 chars',
        );
      }
    });
  });
});
