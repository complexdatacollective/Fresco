import { useLocalStorage } from 'usehooks-ts';
import { type z } from 'zod/v3';

/**
 * A reusable state hook that combines localstorage with zod schema validation.
 *
 * Features:
 *   - Builds on useLocalStorage from @uidotdev/usehooks
 *   - Validates state against a zod schema both when reading and writing.
 *   - If data being read is incompatible, resets to an initial state
 */
export default function useSafeLocalStorage<T>(
  key: string,
  schema: z.Schema<T>,
  initialData: T,
) {
  const storage = useLocalStorage(key, initialData, {
    initializeWithValue: false,
    deserializer(value) {
      // If the value fails schema validation, fallback to initialData
      try {
        const rawValue = JSON.parse(value);

        const safeNewValue = schema.safeParse(rawValue);
        if (!safeNewValue.success) {
          // eslint-disable-next-line no-console
          console.log('Existing data was invalid. Discarding.');
          storage[1](initialData); // Not sure why, but destructuring value and setValue above causes TS errors.
          return initialData;
        }

        return safeNewValue.data;
      } catch (e) {
        return initialData;
      }
    },
  });

  return storage;
}
