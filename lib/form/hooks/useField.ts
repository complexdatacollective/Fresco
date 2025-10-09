import { useCallback, useEffect, useId, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
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
function useFieldShouldShowError(
  fieldState: FieldState | undefined,
  fieldErrors: string[] | null,
) {
  if (!fieldState) {
    return false;
  }

  const { state } = fieldState;

  return Boolean(state.isTouched && fieldErrors && fieldErrors.length > 0);
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
    'onBlur': (e: React.FocusEvent) => void;
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
  const id = useId();

  const isUnmountingRef = useRef(false);

  const fieldState = useFormStore((state) => state.getFieldState(config.name));

  const fieldErrors = useFormStore(
    useShallow((state) => state.getFieldErrors(config.name)),
  );
  const registerField = useFormStore((store) => store.registerField);
  const unregisterField = useFormStore((store) => store.unregisterField);
  const setFieldValue = useFormStore((store) => store.setFieldValue);
  const setFieldTouched = useFormStore((store) => store.setFieldTouched);
  const validateField = useFormStore((store) => store.validateField);

  const shouldShowError = useFieldShouldShowError(fieldState, fieldErrors);

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

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      // Skip validation if clicking on a dialog close element
      const relatedTarget = e.relatedTarget;

      if (relatedTarget?.hasAttribute('data-dialog-close')) {
        return;
      }

      // Skip validation if this field is inside a dialog that's closing
      const target = e.target as HTMLElement;
      const parentDialog = target.closest('dialog');
      if (parentDialog && !parentDialog.open) {
        return;
      }

      setFieldTouched(config.name, true);

      // TODO: cache validation result if value hasn't changed.
      void validateField(config.name);
    },
    [config.name, validateField, setFieldTouched],
  );

  // Ensure the value is never undefined to prevent uncontrolled to controlled warnings
  const currentValue = fieldState?.value ?? config.initialValue;
  const controlledValue = currentValue === undefined ? '' : currentValue;

  const result: UseFieldConfig = {
    id,
    meta: {
      shouldShowError,
      errors: fieldErrors,
      isValid: fieldState?.state.isValid ?? false,
      isTouched: fieldState?.state.isTouched ?? false,
      isDirty: fieldState?.state.isDirty ?? false,
      isValidating: fieldState?.state.isValidating ?? false,
    },
    containerProps: {
      'data-field-name': config.name, // Used for scrolling to field errors
    },
    fieldProps: {
      'value': controlledValue,
      'onChange': handleChange,
      'onBlur': handleBlur,
      'aria-required': config.required ?? false,
      'aria-invalid': shouldShowError,
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
