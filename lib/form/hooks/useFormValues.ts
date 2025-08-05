import { useStore } from 'zustand';
import { useFormName } from '../context/FormNameContext';
import { getFormStore } from '../store/formStore';

/**
 * Hook to subscribe to form values for conditional rendering
 * @param fieldName - Optional specific field name to watch. If not provided, watches all form values
 * @returns The form values or the specific field value
 */
export function useFormValues(): Record<string, unknown>;
export function useFormValues<T = unknown>(fieldName: string): T;
export function useFormValues<T = unknown>(
  fieldName?: string,
): Record<string, unknown> | T {
  const formName = useFormName();
  const store = getFormStore();

  // Subscribe to form values
  const formValues = useStore(store, (state) => state.getFormValues(formName));

  if (fieldName) {
    return formValues[fieldName] as T;
  }

  return formValues;
}
