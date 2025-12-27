import { type Codebook, type StageSubject } from '@codaco/protocol-validation';
import { type NcNetwork } from '@codaco/shared-consts';
import { type JSONContent } from '@tiptap/core';
import type * as z from 'zod/v4';

export type FieldValue =
  | string
  | (string | number | boolean | Record<string, unknown>)[]
  | number
  | boolean
  | JSONContent
  | undefined;

/**
 * Value/onChange props for field components.
 *
 * These props are marked optional to support two usage patterns:
 *
 * 1. **Within Field** (primary pattern): Field always provides these props
 *    via useField hook. Components receive value and onChange automatically.
 *
 * 2. **Standalone** (secondary pattern): Components can be used outside of
 *    Field for simple controlled inputs. In uncontrolled mode, components
 *    manage their own internal state when onChange is not provided.
 *
 * The value type V must extend FieldValue.
 */
export type FieldValueProps<V extends FieldValue> = {
  value?: V | undefined;
  onChange?: (value: V) => void;
};

/**
 * Flattened errors type - uses Zod's core flattened error type
 * This ensures compatibility with z.flattenError() output for any schema
 */
export type FlattenedErrors = z.core.$ZodFlattenedError<
  Record<string, FieldValue>
>;

export type FieldValidation =
  | z.ZodType
  | ((
      formValues: Record<string, FieldValue>,
    ) => z.ZodType | Promise<z.ZodType>);

/**
 * Schema for custom validation - can be a Zod schema directly, or a function
 * that receives form values and validation context and returns a schema.
 */
export type CustomValidationSchema =
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
  schema: CustomValidationSchema;
  hint: string;
};

export type ValidationResult<T extends z.ZodTypeAny> =
  | { success: true; data: z.infer<T> }
  | { success: false; error: z.ZodError<z.infer<T>> };

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
  validation?: FieldValidation;
};

export type ChangeHandler<V = FieldValue> = (
  valueOrEvent:
    | V
    | React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
) => void;

export type FormState = {
  fields: Map<string, FieldState>;
  isSubmitting: boolean;
  isValidating: boolean;
  isValid: boolean;
};

export type FieldConfig = {
  name: string;
  initialValue?: FieldValue;
  validation?: FieldValidation;
};

export type FormSubmitHandler = (
  values: unknown,
) => FormSubmissionResult | Promise<FormSubmissionResult>;

export type FormConfig = {
  onSubmit: FormSubmitHandler;
  onSubmitInvalid?: (errors: FlattenedErrors) => void;
};

// Context for validation functions
export type ValidationContext = {
  stageSubject: StageSubject;
  codebook: Codebook;
  network: NcNetwork;
};

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

/**
 * Type for field errors object (used for scrolling to first error)
 */
export type FormFieldErrors = Record<string, string[] | null>;
