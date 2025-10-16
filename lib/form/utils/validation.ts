import { type z } from 'zod';
import type { FieldValidation, FieldValue, ValidationResult } from '../types';

export async function validateFieldValue<T extends z.ZodTypeAny>(
  value: unknown,
  validation: FieldValidation,
  formValues: Record<string, FieldValue>,
): Promise<ValidationResult<T>> {
  const schema =
    typeof validation === 'function'
      ? await validation(formValues)
      : validation;

  return (await schema.safeParseAsync(value)) as ValidationResult<T>;
}
