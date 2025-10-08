import { type ZodError, type ZodType } from 'zod';
import { useShallow } from 'zustand/react/shallow';
import { type FormStore } from '../store/formStore';
import { useFormStore } from '../store/formStoreProvider';
import type { FieldValue } from '../types';

/**
 * Form state values with submission method
 */
export type FormStateValues = {
  /** Map of field states */
  fields: Map<
    string,
    {
      value: FieldValue;
      meta: {
        errors: string[] | null;
        isValidating: boolean;
        isTouched: boolean;
        isDirty: boolean;
        isValid: boolean;
      };
    }
  >;
  /** All errors in the form (both field and form level) */
  errors: ZodError | null;
  /** Whether the form is currently being submitted */
  isSubmitting: boolean;
  /** Whether the form is currently being validated */
  isValidating: boolean;
  /** Whether any field in the form has been modified */
  isDirty: boolean;
  /** Whether all fields in the form are valid */
  isValid: boolean;
  /** Additional context data for the form */
  context: Record<string, unknown>;
  /** Method to submit the form programmatically */
  submitForm: () => Promise<void>;
};

/**
 * Hook to access form state values and submission method.
 * Uses shallow equality checking to minimize re-renders.
 *
 * @example
 * ```tsx
 * const formState = useFormState();
 *
 * // Access form validity
 * if (formState.isValid) {
 *   // Form is valid
 * }
 *
 * // Check if form has been modified
 * if (formState.isDirty) {
 *   // Show unsaved changes warning
 * }
 *
 * // Submit form programmatically
 * await formState.submitForm();
 * ```
 */
export default function useFormState(): FormStateValues {
  return useFormStore(
    useShallow((state: FormStore<ZodType<unknown>>) => ({
      fields: state.fields,
      errors: state.errors,
      isSubmitting: state.isSubmitting,
      isValidating: state.isValidating,
      isDirty: state.isDirty,
      isValid: state.isValid,
      context: state.context,
      submitForm: state.submitForm,
    })),
  );
}

/**
 * Hook to access specific field state.
 * Only re-renders when the specific field changes.
 *
 * @param fieldName - The name of the field to access
 * @returns The field state or undefined if field doesn't exist
 *
 * @example
 * ```tsx
 * const emailField = useFieldState('email');
 *
 * if (emailField?.meta.errors) {
 *   // Show field errors
 * }
 * ```
 */
export function useFieldState(fieldName: string) {
  return useFormStore(
    useShallow((state: FormStore<ZodType<unknown>>) => {
      const field = state.fields.get(fieldName);
      if (!field) return undefined;

      return {
        value: field.value,
        meta: {
          errors: field.meta.errors,
          isValidating: field.meta.isValidating,
          isTouched: field.meta.isTouched,
          isDirty: field.meta.isDirty,
          isValid: field.meta.isValid,
        },
      };
    }),
  );
}

/**
 * Hook to access all form values as a plain object.
 * Only re-renders when form values change.
 *
 * @returns Object containing all form field values
 *
 * @example
 * ```tsx
 * const values = useFormValues();
 * console.log(values); // { email: 'user@example.com', name: 'John' }
 * ```
 */
export function useFormValues(): Record<string, FieldValue> {
  return useFormStore((state: FormStore<ZodType<unknown>>) =>
    state.getFormValues(),
  );
}

/**
 * Hook to access form metadata (validity, dirty state, etc).
 * Only re-renders when these specific flags change.
 *
 * @returns Object containing form metadata flags
 *
 * @example
 * ```tsx
 * const { isValid, isDirty, isSubmitting } = useFormMeta();
 *
 * <button disabled={!isValid || isSubmitting}>
 *   Submit
 * </button>
 * ```
 */
export function useFormMeta() {
  return useFormStore(
    useShallow((state: FormStore<ZodType<unknown>>) => ({
      isSubmitting: state.isSubmitting,
      isValidating: state.isValidating,
      isDirty: state.isDirty,
      isValid: state.isValid,
    })),
  );
}

/**
 * Hook to check if a specific field exists in the form.
 *
 * @param fieldName - The name of the field to check
 * @returns Boolean indicating if the field exists
 *
 * @example
 * ```tsx
 * const hasEmailField = useHasField('email');
 * ```
 */
export function useHasField(fieldName: string): boolean {
  return useFormStore((state: FormStore<ZodType<unknown>>) =>
    state.fields.has(fieldName),
  );
}

/**
 * Hook to get the count of fields in the form.
 *
 * @returns The number of registered fields
 *
 * @example
 * ```tsx
 * const fieldCount = useFieldCount();
 * console.log(`Form has ${fieldCount} fields`);
 * ```
 */
export function useFieldCount(): number {
  return useFormStore(
    (state: FormStore<ZodType<unknown>>) => state.fields.size,
  );
}

/**
 * Hook to access only the form submission method.
 * Optimized for components that only need to submit the form.
 *
 * @returns Function to submit the form programmatically
 *
 * @example
 * ```tsx
 * const submitForm = useSubmitForm();
 *
 * const handleClick = async () => {
 *   await submitForm();
 * };
 * ```
 */
export function useSubmitForm(): () => Promise<void> {
  return useFormStore((state: FormStore<ZodType<unknown>>) => state.submitForm);
}
