import { useCallback, useEffect, useId, useRef } from 'react';
import { useFormStore } from '../store/formStoreProvider';
import type {
  ChangeHandler,
  FieldConfig,
  FieldState,
  FieldValue,
} from '../types';

/**
 * Helper function to determine if a field should show an error message.
 */
function useFieldShouldShowError(name: string) {
  const fieldState = useFormStore((state) => state.getFieldState(name));

  if (!fieldState) {
    return false;
  }

  const { meta } = fieldState;

  return Boolean(
    !meta.isValid && meta.isTouched && meta.errors && meta.errors.length > 0,
  );
}

export type UseFieldConfig = {
  id: string;
  meta: {
    shouldShowError: boolean;
    errors: string[] | null;
    isValidating: boolean;
    isTouched: boolean;
    isDirty: boolean;
    isValid: boolean;
  };
  containerProps: {
    'data-field-name': string; // Used for scrolling to field errors
  };
  fieldProps: {
    'value': FieldValue;
    'onChange': ChangeHandler; // Handles both direct value changes and event-based changes
    'onBlur': () => void;
    'aria-required': boolean; // Indicates if the field is required
    'aria-invalid': boolean; // Indicates if the field is invalid
    'aria-describedby': string; // IDs of elements that provide additional information about the field
  };
};

// Keys of UseFieldConfig
export type UseFieldKeys = keyof UseFieldConfig;

export function useField(config: {
  name: string;
  initialValue?: FieldValue;
  required?: boolean;
  validation?: FieldConfig['validation'];
}): UseFieldConfig {
  // Create an ID that can be used to link Label, Hint, and Field.
  const id = useId();

  // Get the stable store API reference
  const isUnmountingRef = useRef(false);

  // Subscribe to the specific field state using Zustand's useStore hook
  const fieldState: FieldState | undefined = useFormStore((state) =>
    state.getFieldState(config.name),
  );
  const registerField: (config: FieldConfig) => void = useFormStore(
    (store) => store.registerField,
  );
  const unregisterField: (fieldName: string) => void = useFormStore(
    (store) => store.unregisterField,
  );
  const setFieldValue: (fieldName: string, value: FieldValue) => void =
    useFormStore((store) => store.setFieldValue);
  const setFieldTouched: (fieldName: string, touched: boolean) => void =
    useFormStore((store) => store.setFieldTouched);
  const validateField: (fieldName: string) => Promise<void> = useFormStore(
    (store) => store.validateField,
  );

  const shouldShowError = useFieldShouldShowError(config.name);

  // Register field on mount - use useLayoutEffect to ensure it runs after form registration
  useEffect(() => {
    isUnmountingRef.current = false; // Reset the flag on each mount
    registerField({
      name: config.name,
      initialValue: config.initialValue,
      validation: config.validation,
    });

    return () => {
      isUnmountingRef.current = true;
      unregisterField(config.name);
    };

    // NOTE: We intentionally exclude config.validation from dependencies
    // because validation functions are often defined inline and would cause
    // unnecessary re-registrations. The validation is used during validation
    // calls, not during registration.
    //
    // TODO: memoize the validation function so that this is safe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.name, config.initialValue, unregisterField, registerField]);

  const handleChange: ChangeHandler = useCallback(
    (valueOrEvent) => {
      // Smart detection: if it's an event object, extract the value; otherwise use as-is
      let value: FieldValue;
      if (
        valueOrEvent &&
        typeof valueOrEvent === 'object' &&
        'target' in valueOrEvent &&
        valueOrEvent.target instanceof EventTarget
      ) {
        // It's an event object, extract the value
        value = valueOrEvent.target.value;
      } else {
        // It's a direct value
        value = valueOrEvent as FieldValue;
      }

      setFieldValue(config.name, value);
      void validateField(config.name);
    },
    [config.name, setFieldValue, validateField],
  );

  const handleBlur = useCallback(() => {
    console.log('handleBlur', config.name);
    setFieldTouched(config.name, true);

    // TODO: cache validation result if value hasn't changed.
    void validateField(config.name);
  }, [config.name, validateField, setFieldTouched]);

  // Ensure the value is never undefined to prevent uncontrolled to controlled warnings
  const currentValue = fieldState?.value ?? config.initialValue;
  const controlledValue = currentValue === undefined ? '' : currentValue;

  const result: UseFieldConfig = {
    id,
    meta: {
      shouldShowError,
      errors: fieldState?.meta.errors ?? null,
      isValid: fieldState?.meta.isValid ?? false,
      isTouched: fieldState?.meta.isTouched ?? false,
      isDirty: fieldState?.meta.isDirty ?? false,
      isValidating: fieldState?.meta.isValidating ?? false,
    },
    containerProps: {
      'data-field-name': config.name, // Used for scrolling to field errors
    },
    fieldProps: {
      'value': controlledValue,
      'onChange': handleChange,
      'onBlur': handleBlur,
      'aria-required': config.required ?? false,
      'aria-invalid': shouldShowError && !fieldState?.meta.isValid,
      /**
       * Set this so that screen readers can properly announce the hint and error messages.
       * If either the hint or error ID is not present, it will be ignored by the screen reader.
       * The alternative would require us to check if the hint prop exists and if the error state
       * is set, which doesn't seem worth it.
       *
       * Note: we cannot use aria-description yet, as it is not widely supported.
       */
      'aria-describedby': `${id}-hint ${id}-error`.trim(),
    },
  };

  return result;
}
