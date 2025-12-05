import { useShallow } from 'zustand/react/shallow';
import { type FieldValue } from '../components/types';
import { useFormStore } from '../store/formStoreProvider';

/**
 * Hook to get form field values by field names
 * @param fieldNames - Array of field names to watch
 * @returns Record of field names to their values
 */
export function useFormValue<
  const K extends readonly string[],
  T extends FieldValue = FieldValue,
>(fieldNames: K): Record<K[number], T | undefined> {
  return useFormStore(
    useShallow((state) => {
      const values: Record<string, T | undefined> = {};
      for (const name of fieldNames) {
        const field = state.getFieldState(name);
        values[name] = field?.value as T | undefined;
      }
      return values as Record<K[number], T | undefined>;
    }),
  );
}
