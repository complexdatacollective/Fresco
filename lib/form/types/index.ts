import { type z } from 'zod';

export type FieldValue = unknown;

export type FieldState = {
  value: FieldValue;
  meta: {
    error: string | null;
    isValidating: boolean;
    isTouched: boolean;
    isDirty: boolean;
    isValid: boolean;
  };
};

export type FormState = {
  fields: Record<string, FieldState>;
  isSubmitting: boolean;
  isValidating: boolean;
  submitCount: number;
  isValid: boolean;
};

export type FieldConfig<TContext = unknown> = {
  initialValue?: FieldValue;
  validation?:
    | z.ZodTypeAny
    | ((
        context: ValidationContext<TContext>,
      ) => z.ZodTypeAny | Promise<z.ZodTypeAny>);
};

export type FormConfig<TContext = unknown> = {
  name: string;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  onSubmitInvalid?: (errors: FormErrors) => void;
  focusFirstInput?: boolean;
  additionalContext?: TContext;
  validation?: (
    values: Record<string, unknown>,
  ) => FormErrors | Promise<FormErrors>;
};

export type ValidationContext<TContext = unknown> = {
  additionalContext?: TContext;
  formValues: Record<string, unknown>;
};

export type FormErrors = Record<string, string>;
