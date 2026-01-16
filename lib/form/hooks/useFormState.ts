import { useShallow } from 'zustand/react/shallow';
import { type FormStore } from '../store/formStore';
import useFormStore from './useFormStore';

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
export default function useFormState() {
  return useFormStore(
    useShallow((state: FormStore) => ({
      fields: state.fields,
      errors: state.errors,
      isSubmitting: state.isSubmitting,
      isValidating: state.isValidating,
      isDirty: state.isDirty,
      isValid: state.isValid,
      submitForm: state.submitForm,
    })),
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
    useShallow((state: FormStore) => ({
      isSubmitting: state.isSubmitting,
      isValidating: state.isValidating,
      isDirty: state.isDirty,
      isValid: state.isValid,
    })),
  );
}
