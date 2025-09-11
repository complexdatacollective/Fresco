import { Codebook, StageSubject } from '@codaco/protocol-validation';
import { NcNetwork, type VariableValue } from '@codaco/shared-consts';
import type * as z from 'zod/v4';
import { VariableDefinition } from '~/lib/network-exporters/formatters/csv/processEntityVariables';

export type FieldValue = VariableValue | undefined;

export type FieldValidation =
  | z.ZodType
  | ((context: ValidationContext) => z.ZodType | Promise<z.ZodType>);

export type ValidationResult<T extends z.ZodTypeAny> =
  | { success: true; data: z.infer<T> }
  | { success: false; error: z.ZodError<z.infer<T>> };

export type FieldState<T extends FieldValue = FieldValue> = {
  value: T;
  initialValue?: T;
  meta: {
    errors: z.ZodError<z.infer<T>> | null;
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
  onSubmitInvalid?: (errors: z.ZodError<z.infer<T>>) => void;
};

// Context for validation functions
export type ValidationContext = {
  subject: StageSubject;
  variable: VariableDefinition;
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
