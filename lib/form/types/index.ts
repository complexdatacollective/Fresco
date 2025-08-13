import { z } from 'zod';
import { type FieldValue } from '~/lib/interviewer/utils/field-validation';

export type FieldState<T extends FieldValue = FieldValue> = {
  value: T;
  initialValue?: T;
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

export type FormSubmitHandler = (
  values: Record<string, unknown>,
) => FormSubmissionResult | Promise<FormSubmissionResult>;

export type FormConfig = {
  onSubmit: FormSubmitHandler;
  onSubmitInvalid?: (errors: FormErrors) => void;
  additionalContext?: Record<string, unknown>;
};

export type ValidationContext = {
  formValues: Record<string, unknown>;
} & Record<string, unknown>;

/**
 * Zod schemas for form submission results
 * These provide both type generation and runtime validation
 */

// Schema for form errors (field-level errors)
export const FormErrorsSchema = z.record(z.string(), z.array(z.string()));
export type FormErrors = z.infer<typeof FormErrorsSchema>;

// Schema for successful submission
export const FormSubmissionSuccessSchema = z.object({
  success: z.literal(true),
  data: z.unknown().optional(),
});
export type FormSubmissionSuccess = z.infer<typeof FormSubmissionSuccessSchema>;

// Schema for failed submission with errors
export const FormSubmissionErrorSchema = z.object({
  success: z.literal(false),
  errors: z
    .union([
      z.object({
        form: z.array(z.string()),
        fields: FormErrorsSchema.optional(),
      }),
      z.object({
        form: z.array(z.string()).optional(),
        fields: FormErrorsSchema,
      }),
    ])
    .optional(),
});

export type FormSubmissionError = z.infer<typeof FormSubmissionErrorSchema>;

// Combined schema for any form submission result
export const FormSubmissionResultSchema = z.discriminatedUnion('success', [
  FormSubmissionSuccessSchema,
  FormSubmissionErrorSchema,
]);
export type FormSubmissionResult = z.infer<typeof FormSubmissionResultSchema>;

export type BaseFieldProps = {
  name: string;
  label: string;
  hint?: string;
  placeholder?: string;
  className?: string;
  value?: FieldValue;
  onChange?: (value: FieldValue) => void;
};
