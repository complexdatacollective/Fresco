import { z } from 'zod';
import type { FieldState, ValidationContext } from '../types';

export async function validateFieldValue(
  value: unknown,
  validation: FieldState['validation'],
  context: ValidationContext,
): Promise<
  { isValid: true; errors: null } | { isValid: false; errors: string[] }
> {
  if (!validation) {
    return { isValid: true, errors: null };
  }

  try {
    let schema: z.ZodTypeAny;

    if (typeof validation === 'function') {
      const result = validation(context);
      schema = result instanceof Promise ? await result : result;
    } else {
      schema = validation;
    }

    await schema.parseAsync(value);
    return { isValid: true, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map((e) => e.message) ?? ['Invalid value'],
      };
    }
    return { isValid: false, errors: ['Validation error'] };
  }
}
