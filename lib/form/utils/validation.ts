import { z } from 'zod';
import type { FieldConfig, ValidationContext } from '../types';

export async function validateFieldValue(
  value: any,
  validation: FieldConfig['validation'],
  context: ValidationContext,
): Promise<{ isValid: boolean; error: string | null }> {
  if (!validation) {
    return { isValid: true, error: null };
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
    return { isValid: true, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0]?.message || 'Invalid value',
      };
    }
    return { isValid: false, error: 'Validation error' };
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
