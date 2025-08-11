import { useCallback, useEffect, useId, useRef } from 'react';
import { type FieldValue } from '~/lib/interviewer/utils/field-validation';
import { useFormStore } from '../store/formStoreProvider';
import type { FieldConfig, FieldState } from '../types';

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

export type UseFieldConfig<T extends FieldValue = FieldValue> = {
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
    'value': T;
    'onChange': (valueOrEvent: T | React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    'onBlur': () => void;
    'aria-invalid': boolean; // Indicates if the field is invalid
    'aria-describedby': string; // IDs of elements that provide additional information about the field
  };
};

// Keys of UseFieldConfig
export type UseFieldKeys = keyof UseFieldConfig;

export function useField<T extends FieldValue = FieldValue>(config: {
  name: string;
  initialValue?: T;
  required?: boolean;
  validation?: FieldConfig['validation'];
}): UseFieldConfig<T> {
  // Create an ID that can be used to link Label, Hint, and Field.
  const id = useId();

  // Get the stable store API reference
  const isUnmountingRef = useRef(false);

  // Subscribe to the specific field state using Zustand's useStore hook
  const fieldState: FieldState | undefined = useFormStore((state) => state.getFieldState(config.name));
  const registerField: (config: FieldConfig) => void = useFormStore((store) => store.registerField);
  const unregisterField: (fieldName: string) => void = useFormStore((store) => store.unregisterField);  
  const setFieldValue: (fieldName: string, value: FieldValue) => void = useFormStore((store) => store.setFieldValue);
  const setFieldTouched: (fieldName: string, touched: boolean) => void = useFormStore((store) => store.setFieldTouched);
  const validateField: (fieldName: string) => Promise<void> = useFormStore((store) => store.validateField);

  const shouldShowError = useFieldShouldShowError(config.name);

  // Register field on mount - use useLayoutEffect to ensure it runs after form registration
  useEffect(() => {
    if (!isUnmountingRef.current) {
      registerField({
        name: config.name,
        initialValue: config.initialValue,
        validation: config.validation,
      });
    }
    return () => {
      isUnmountingRef.current = true;
      unregisterField(config.name);
    };
  }, [
    config.name,
    config.initialValue,
    config.validation,
    unregisterField,
    registerField,
  ]);

  const handleChange = useCallback(
    (valueOrEvent: T | React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      // Smart detection: if it's an event object, extract the value; otherwise use as-is
      let value: T;
      if (valueOrEvent && typeof valueOrEvent === 'object' && 'target' in valueOrEvent && 'type' in valueOrEvent) {
        // It's an event object, extract the value
        value = (valueOrEvent as React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>).target.value as T;
      } else {
        // It's a direct value
        value = valueOrEvent as T;
      }
      
      setFieldValue(config.name, value);
      void validateField(config.name);
    },
    [config.name, setFieldValue, validateField],
  );

  const handleBlur = useCallback(() => {
    setFieldTouched(config.name, true);

    // TODO: cache validation result if value hasn't changed.
    void validateField(config.name);
  }, [config.name, validateField, setFieldTouched]);

  const result: UseFieldConfig<T> = {
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
      'value': (fieldState?.value ?? config.initialValue) as T,
      'onChange': handleChange,
      'onBlur': handleBlur,
      // 'aria-required': true, // TODO: find a way to set this based on the validation config.
      'aria-invalid': !fieldState?.meta.isValid,
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
