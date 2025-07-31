import { type z } from 'zod';

export type FieldValue = any;

export type FieldState = {
  value: FieldValue;
  error: string | null;
  isValidating: boolean;
  isTouched: boolean;
  isDirty: boolean;
  isValid: boolean;
};

export type FormState = {
  fields: Record<string, FieldState>;
  isSubmitting: boolean;
  isValidating: boolean;
  submitCount: number;
  isValid: boolean;
};

export type FieldConfig = {
  initialValue?: FieldValue;
  validation?:
    | z.ZodTypeAny
    | ((context: ValidationContext) => z.ZodTypeAny | Promise<z.ZodTypeAny>);
};

export type FormConfig = {
  name: string;
  onSubmit: (values: Record<string, any>) => void | Promise<void>;
  onSubmitInvalid?: (errors: FormErrors) => void;
  focusFirstInput?: boolean;
  fieldContext?: any;
  validation?: (
    values: Record<string, any>,
  ) => FormErrors | Promise<FormErrors>;
};

export type ValidationContext = {
  formContext: any;
  fieldContext: any;
  formValues: Record<string, any>;
};

export type FormErrors = Record<string, string>;
