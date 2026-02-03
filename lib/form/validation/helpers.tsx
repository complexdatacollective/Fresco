import { z } from 'zod';
import { UnorderedList } from '~/components/typography/UnorderedList';
import type {
  CustomFieldValidation,
  FieldValidationFunction,
  FieldValue,
  ValidationContext,
  ValidationResult,
} from '../store/types';
import {
  type ValidationFunction,
  type ValidationParameter,
  validationPropKeys,
  validations,
} from './functions';

/**
 * Validates a field value against a validation schema.
 *
 * This function handles both static Zod schemas and dynamic validation functions
 * that generate schemas based on form state. It uses Zod's `safeParseAsync` for
 * non-throwing validation that returns a discriminated union result.
 *
 * @template T - The Zod schema type, defaults to `z.ZodTypeAny`
 *
 * @param value - The field value to validate
 * @param validation - Either a Zod schema directly, or a function that receives
 *   the current form values and returns a Zod schema (sync or async)
 * @param formValues - Current values of all form fields, used when validation
 *   depends on other field values (e.g., sameAs, differentFrom validations)
 *
 * @returns A promise resolving to a `ValidationResult<T>`:
 *   - On success: `{ success: true, data: T }` where data is the parsed value
 *   - On failure: `{ success: false, error: z.ZodError }` containing validation issues
 *
 * @example
 * ```typescript
 * const result = await validateFieldValue(
 *   'test@example.com',
 *   z.string().email(),
 *   {}
 * );
 *
 * if (result.success) {
 *   console.log('Valid email:', result.data);
 * } else {
 *   console.log('Errors:', result.error.issues);
 * }
 * ```
 */
export async function validateFieldValue<T extends z.ZodTypeAny>(
  value: unknown,
  validation: FieldValidationFunction,
  formValues: Record<string, FieldValue>,
): Promise<ValidationResult<T>> {
  const schema =
    typeof validation === 'function'
      ? await validation(formValues)
      : validation;

  return (await schema.safeParseAsync(value)) as ValidationResult<T>;
}

/**
 * Helper function that parses component props and converts them into a validation
 * using functions from ~/lib/form/validation/index.ts.
 *
 * Exported for use by UnconnectedField.
 */
export function makeValidationFunction(props: Record<string, unknown>) {
  const validationContext = props.validationContext as
    | ValidationContext
    | undefined;

  return (formValues: Record<string, FieldValue>) =>
    z.unknown().superRefine(async (fieldValue, ctx) => {
      // Handle built-in validations from the validations object
      const validationEntries = Object.entries(props).filter(
        ([key]) =>
          key in validations && key !== 'validationContext' && key !== 'custom',
      );

      for (const [validationName, parameter] of validationEntries) {
        try {
          const validationFnFactory = validations[
            validationName as keyof typeof validations
          ] as ValidationFunction<ValidationParameter>;

          const validationFn = validationFnFactory(
            parameter as ValidationParameter,
            validationContext,
          )(formValues);

          const result = await validationFn.safeParseAsync(fieldValue);

          if (!result.success && result.error) {
            result.error.issues.forEach((issue) => {
              ctx.addIssue({
                code: 'custom',
                message: issue.message,
                path: [...issue.path],
              });
            });
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error while validating:', error);
          ctx.addIssue({
            code: 'custom',
            message: 'An error occurred while validating.',
          });
        }
      }

      // Handle custom validations (single or array)
      if ('custom' in props && props.custom) {
        const customValidations = Array.isArray(props.custom)
          ? (props.custom as CustomFieldValidation[])
          : [props.custom as CustomFieldValidation];

        for (const { schema } of customValidations) {
          try {
            // Resolve schema if it's a function
            const resolvedSchema =
              typeof schema === 'function'
                ? await schema(formValues, validationContext)
                : schema;

            const result = await resolvedSchema.safeParseAsync(fieldValue);

            if (!result.success && result.error) {
              result.error.issues.forEach((issue) => {
                ctx.addIssue({
                  code: 'custom',
                  message: issue.message,
                  path: [...issue.path],
                });
              });
            }
          } catch (error) {
            // eslint-disable-next-line no-console
            console.log('custom validation error', error);
            ctx.addIssue({
              code: 'custom',
              message: 'An error occurred while validating.',
            });
          }
        }
      }
    });
}

/**
 * Helper function that generates a human readable summary of the validation rules
 * applied to a field by extracting hint metadata from each validation schema.
 *
 * Exported for use by UnconnectedField.
 */
export function makeValidationHints(props: Record<string, unknown>) {
  const validationContext = props.validationContext as
    | ValidationContext
    | undefined;

  const validationEntries = Object.entries(props).filter(
    ([key]) =>
      key in validations && key !== 'validationContext' && key !== 'custom',
  );

  const hints: string[] = [];

  for (const [validationName, parameter] of validationEntries) {
    // Skip required=false or other falsy values that indicate no validation
    if (validationName === 'required' && parameter !== true) {
      continue;
    }

    try {
      const validationFnFactory = validations[
        validationName as keyof typeof validations
      ] as ValidationFunction<
        string | number | boolean | { regex: string; hint: string }
      >;

      // Call the factory with the parameter to get the validation function
      // Pass empty object as formValues since we just need metadata
      const validationFn = validationFnFactory(
        parameter as
          | string
          | number
          | boolean
          | { regex: string; hint: string },
        validationContext,
      )({});

      // Extract hint from the schema's metadata
      const meta = validationFn.meta() as { hint?: string } | undefined;
      if (meta?.hint) {
        hints.push(meta.hint);
      }
    } catch {
      // If we can't get the hint (e.g., missing context for some validations),
      // skip this validation's hint
      // eslint-disable-next-line no-console
      console.warn(`Could not extract hint for validation: ${validationName}`);
    }
  }

  // Handle custom validation hints
  if ('custom' in props && props.custom) {
    const customValidations = Array.isArray(props.custom)
      ? (props.custom as CustomFieldValidation[])
      : [props.custom as CustomFieldValidation];

    for (const { hint } of customValidations) {
      hints.push(hint);
    }
  }

  if (hints.length === 0) {
    return null;
  }

  return (
    <UnorderedList className="mb-4!">
      {hints.map((hint, index) => (
        <li key={index}>{hint}</li>
      ))}
    </UnorderedList>
  );
}

export function filterValidationProps(
  props: Record<string, unknown>,
): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (!validationPropKeys.includes(key as keyof typeof validations)) {
      filtered[key] = value;
    }
  }
  return filtered;
}
