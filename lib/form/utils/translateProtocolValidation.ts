import { z } from 'zod';
import { FieldWithMetadata } from '~/lib/interviewer/selectors/forms';
import { getValidation } from '~/lib/interviewer/utils/field-validation';
import type { FieldValidation, ValidationContext } from '../types';

/**
 * Translates protocol validation rules to a single Zod schema
 */
export function translateProtocolValidation(
  field: FieldWithMetadata,
  context: ValidationContext,
): FieldValidation {
  const { validation } = field;

  if (!validation) {
    return z.any();
  }

  return (formValues: Record<string, unknown>) => {
    return z.any().superRefine((value, ctx) => {
      const fn = getValidation(validation, context);

      const result = fn.forEach((issue) => {
        const t = issue(value, formValues, p, n);

        if (t) {
          ctx.addIssue(t);
        }
      });
    });
  };
}
