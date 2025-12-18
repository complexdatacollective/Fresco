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
 * Custom field validation with required hint metadata.
 * The schema can be a Zod schema directly, or a function that receives
 * form values and returns a schema (for validations that depend on other fields).
 *
 * @example
 * ```tsx
 * // Simple validation
 * <Field
 *   custom={{ schema: z.email(), hint: 'Enter a valid email' }}
 * />
 *
 * // Multiple validations
 * <Field
 *   custom={[
 *     { schema: z.string().min(5), hint: 'At least 5 characters' },
 *     { schema: z.string().max(100), hint: 'Maximum 100 characters' },
 *   ]}
 * />
 *
 * // Context-aware validation
 * <Field
 *   custom={{
 *     schema: (formValues) => z.string().refine(
 *       (val) => val !== formValues.otherField,
 *       'Must be different from other field'
 *     ),
 *     hint: 'Must be different from other field',
 *   }}
 * />
 * ```
 */
export type CustomFieldValidation = {
  schema: FieldValidation;
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

/**
 * Props that all fields **must** handle.
 */
export type BaseFieldProps = {
  label: string;
  hint?: React.ReactNode;
};

export type BaseFieldComponentProps<T extends FieldValue> = {
  id: string;
  name: string;
  value: T;
  onChange: (value: T) => void;
};
