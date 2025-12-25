import { type Codebook, type StageSubject } from '@codaco/protocol-validation';
import { type NcNetwork, type VariableValue } from '@codaco/shared-consts';
import type * as z from 'zod/v4';

export type FieldValue = NonNullable<VariableValue> | undefined;

/**
 * Flattened errors type - uses Zod's core flattened error type
 * This ensures compatibility with z.flattenError() output for any schema
 */
export type FlattenedErrors = z.core.$ZodFlattenedError<unknown>;

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

export type FieldState<T extends FieldValue = FieldValue> = {
  value: T;
  initialValue?: T;
  state: {
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
  initialValue?: unknown;
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
