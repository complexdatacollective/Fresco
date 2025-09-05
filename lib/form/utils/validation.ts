import { type z } from 'zod';
import type {
  FieldValidation,
  ValidationContext,
  ValidationResult,
} from '../types';

export async function validateFieldValue<T extends z.ZodTypeAny>(
  value: unknown,
  validation: FieldValidation,
  context: ValidationContext,
): Promise<ValidationResult<T>> {
  const schema =
    typeof validation === 'function' ? await validation(context) : validation;

  return schema.safeParse(value) as ValidationResult<T>;
}
