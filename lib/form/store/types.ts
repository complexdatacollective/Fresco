import { type Codebook, type StageSubject } from '@codaco/protocol-validation';
import { type NcNetwork } from '@codaco/shared-consts';
import type * as z from 'zod';

// Re-export FieldValue for convenience
export { type FieldValue } from '../components/Field/types';
import { type FieldValue } from '../components/Field/types';

// ═══════════════════════════════════════════════════════════════
// Validation types
// ═══════════════════════════════════════════════════════════════

/**
 * Represents the result of a Zod schema's `safeParseAsync` operation.
 *
 * This is the discriminated union returned by Zod's safe parsing methods:
 * - On success: `{ success: true, data: T }`
 * - On failure: `{ success: false, error: z.ZodError }`
 *
 * Used as the return type for field validation functions.
 *
 * @template T - The Zod schema type being validated against
 */
export type ValidationResult<T extends z.ZodTypeAny = z.ZodTypeAny> = Awaited<
  ReturnType<T['safeParseAsync']>
>;

/**
 * Schema for custom validation - can be a Zod schema directly, or a function
 * that receives form values and validation context and returns a schema.
 */
export type FieldValidationFunction =
  | z.ZodType
  | ((
      formValues: Record<string, FieldValue>,
      validationContext?: ValidationContext,
    ) => z.ZodType | Promise<z.ZodType>);

/**
 * Custom field validation with required hint metadata.
 * The schema can be a Zod schema directly, or a function that receives
 * form values and validation context and returns a schema.
 */
export type CustomFieldValidation = {
  schema: FieldValidationFunction;
  hint: string;
};

/**
 * Context object passed to custom validation functions
 *
 * Some validation functions require that additional context be provided,
 * such as the current stage subject or codebook, to perform their checks.
 */
export type ValidationContext = {
  stageSubject: StageSubject;
  codebook: Codebook;
  network: NcNetwork;
};

// ═══════════════════════════════════════════════════════════════
// Core form state types
// ═══════════════════════════════════════════════════════════════

export type FieldState = {
  value: FieldValue;
  initialValue?: FieldValue;
  meta: {
    isValidating: boolean;
    isTouched: boolean;
    isBlurred: boolean;
    isDirty: boolean;
    isValid: boolean;
  };
  validation?: FieldValidationFunction;
};

export type FieldConfig = {
  name: string;
  initialValue?: FieldValue;
  validation?: FieldValidationFunction;
};

// ═══════════════════════════════════════════════════════════════
// Submission handling
// ═══════════════════════════════════════════════════════════════

/**
 * Flattened errors type - uses Zod's core flattened error type
 * This ensures compatibility with z.flattenError() output for any schema
 */
export type FlattenedErrors = z.core.$ZodFlattenedError<
  Record<string, FieldValue>
>;

/**
 * Form submission result type
 * Designed to be compatible with Zod's flattenError output
 */
export type FormSubmissionResult =
  | {
      success: true;
    }
  | ({
      success: false;
    } & Partial<FlattenedErrors>);

export type FormSubmitHandler = (
  values: unknown,
) => FormSubmissionResult | Promise<FormSubmissionResult>;

export type FormConfig = {
  onSubmit: FormSubmitHandler;
  onSubmitInvalid?: (errors: FlattenedErrors) => void;
};
