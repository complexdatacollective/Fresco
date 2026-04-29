import { useShallow } from 'zustand/react/shallow';
import { type FormStore } from '../store/formStore';
import useFormStore from './useFormStore';

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
