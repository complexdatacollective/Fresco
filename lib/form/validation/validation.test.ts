import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/mini';
import type { FieldValue } from '../store/types';
import { makeValidationHints, validateFieldValue } from './helpers';

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
      const schema = z.string().check(z.minLength(3, 'Too short'));

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
        return z.email({ message: 'Invalid email' });
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
        return z.string().check(z.minLength(5, 'Too short'));
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
        return z
          .string()
          .check(z.minLength(minLength, `Must be at least ${minLength} chars`));
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

  describe('makeValidationHints — min/max', () => {
    function hintTexts(element: ReturnType<typeof makeValidationHints>) {
      if (!element) return [];
      const { container } = render(element);
      return Array.from(container.querySelectorAll('li')).map(
        (li) => li.textContent?.trim() ?? '',
      );
    }

    it('renders a locale-formatted date hint when min is a YYYY-MM-DD string', () => {
      expect(hintTexts(makeValidationHints({ min: '2000-01-01' }))).toEqual([
        'Must be on or after January 1, 2000.',
      ]);
    });

    it('renders the numeric hint when min is a number', () => {
      expect(hintTexts(makeValidationHints({ min: 10 }))).toEqual([
        'Enter a value greater than or equal to 10.',
      ]);
    });

    it('renders both min and max hints together', () => {
      expect(
        hintTexts(
          makeValidationHints({ min: '2000-01-01', max: '2020-12-31' }),
        ),
      ).toEqual([
        'Must be on or after January 1, 2000.',
        'Must be on or before December 31, 2020.',
      ]);
    });
  });
});
