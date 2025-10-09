import { type Codebook, type StageSubject } from '@codaco/protocol-validation';
import { type NcNetwork, type VariableValue } from '@codaco/shared-consts';
import type * as z from 'zod/v4';

export type FieldValue = VariableValue | undefined;

// Type for flattened errors from Zod
export type FlattenedErrors = {
  formErrors: string[];
  fieldErrors: Record<string, string[]>;
};

export type FieldValidation =
  | z.ZodType
  | ((
      formValues: Record<string, FieldValue>,
    ) => z.ZodType | Promise<z.ZodType>);

export type ValidationResult<T extends z.ZodTypeAny> =
  | { success: true; data: z.infer<T> }
  | { success: false; error: z.ZodError<z.infer<T>> };

export type FieldState<T extends FieldValue = FieldValue> = {
  value: T;
  initialValue?: T;
  state: {
    isValidating: boolean;
    isTouched: boolean;
    isDirty: boolean;
    isValid: boolean;
  };
  validation?: FieldValidation;
};

export type ChangeHandler = (
  valueOrEvent:
    | FieldValue
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

export type FormSubmitHandler<T extends z.ZodType> = (
  values: Record<string, unknown>,
) => FormSubmissionResult<T> | Promise<FormSubmissionResult<T>>;

export type FormConfig<T extends z.ZodType> = {
  onSubmit: FormSubmitHandler<T>;
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
type FormSubmissionResult<T extends z.ZodType> =
  | { success: true; errors?: never }
  | { success: false; errors: z.ZodError<z.infer<T>> };

/**
 * Type for field errors object (used for scrolling to first error)
 */
export type FormFieldErrors = Record<string, string[] | null>;

/**
 * Props that all fields **must** handle.
 */
export type BaseFieldProps = {
  name: string;
  label: string;
  hint?: React.ReactNode;
  placeholder?: string;
  className?: string;
  value?: FieldValue;
  onChange?: (value: FieldValue) => void;
};
