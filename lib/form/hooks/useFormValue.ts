import { useShallow } from 'zustand/react/shallow';
import { useFormStore } from '../store/formStoreProvider';
import { type FieldValue } from '~/lib/interviewer/utils/field-validation';

export function useFormValue<T extends FieldValue = FieldValue>(
  fieldName: string,
): T | undefined;
export function useFormValue<T extends FieldValue = FieldValue>(
  fieldNames: string[],
): Record<string, T | undefined>;
export function useFormValue<T extends FieldValue = FieldValue>(
  fieldNameOrNames: string | string[],
): T | undefined | Record<string, T | undefined> {
  const isArray = Array.isArray(fieldNameOrNames);

  const singleValue = useFormStore((state) => {
    if (!isArray) {
      const field = state.getFieldState(fieldNameOrNames);
      return field?.value as T | undefined;
    }
    return undefined;
  });

  const multipleValues = useFormStore(
    useShallow((state) => {
      if (isArray) {
        const values: Record<string, T | undefined> = {};
        for (const name of fieldNameOrNames) {
          const field = state.getFieldState(name);
          values[name] = field?.value as T | undefined;
        }
        return values;
      }
      return {};
    }),
  );

  return isArray ? multipleValues : singleValue;
}
