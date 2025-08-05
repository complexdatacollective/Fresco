import { type z } from 'zod';
import { type FieldValue } from '~/lib/interviewer/utils/field-validation';

export type FieldState = {
  value: FieldValue;
  initialValue?: FieldValue;
  meta: {
    errors: string[] | null;
    isValidating: boolean;
    isTouched: boolean;
    isDirty: boolean;
    isValid: boolean;
  };
  validation?:
    | z.ZodTypeAny
    | ((context: ValidationContext) => z.ZodTypeAny | Promise<z.ZodTypeAny>);
};

export type FormState = {
  fields: Map<string, FieldState>;
  isSubmitting: boolean;
  isValidating: boolean;
  isValid: boolean;
};

export type FieldConfig = {
  name: string;
  initialValue?: FieldValue;
  validation?: z.ZodTypeAny | ((context: ValidationContext) => z.ZodTypeAny);
};

export type FormConfig = {
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  onSubmitInvalid?: (errors: FormErrors) => void;
  additionalContext?: Record<string, unknown>;
};

export type ValidationContext = {
  formValues: Record<string, unknown>;
} & Record<string, unknown>;

export type FormErrors = Record<string, string[]>;
