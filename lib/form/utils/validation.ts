import { z } from 'zod';
import type { FieldState, ValidationContext } from '../types';

export async function validateFieldValue(
  value: unknown,
  validation: FieldState['validation'],
  context: ValidationContext,
): Promise<
  | { isValid: true; errors: null }
  | {
      isValid: false;
      errors: (
        | string
        | { message: string; params?: Record<string, unknown> }
      )[];
    }
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
        errors: error.issues.map((e) => {
          // Check if the error has custom params from refine()
          // The params are stored in the issue itself for refine errors
          const zodIssue = e as z.ZodIssue & {
            params?: Record<string, unknown>;
          };
          if (zodIssue.params) {
            return { message: e.message, params: zodIssue.params };
          }
          return e.message;
        }),
      };
    }
    return { isValid: false, errors: ['Validation error'] };
  }
}
