import { type Codebook, type StageSubject } from '@codaco/protocol-validation';
import { type NcNetwork, type VariableValue } from '@codaco/shared-consts';
import type * as z from 'zod/v4';

export type FieldValue = NonNullable<VariableValue> | undefined;

// Type for flattened errors from Zod
export type FlattenedErrors =
  | {
      formErrors: string[];
      fieldErrors: never;
    }
  | {
      formErrors: never;
      fieldErrors: Record<string, string[]>;
    }
  | {
      formErrors: string[];
      fieldErrors: Record<string, string[]>;
    };

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
 * Zod schemas for form submission results
 * These provide both type generation and runtime validation
 */
export type FormSubmissionResult =
  | {
      success: true;
    }
  | {
      success: false;

      // General form errors not tied to a specific field
      formErrors?: string[];
      // Field-specific errors
      fieldErrors?: Record<string, string[] | undefined>;
    };

/**
 * Type for field errors object (used for scrolling to first error)
 */
export type FormFieldErrors = Record<string, string[] | null>;

export type BaseFieldComponentProps<T extends FieldValue> = {
  id: string;
  name: string;
  value: T;
  onChange: (value: T) => void;
};
