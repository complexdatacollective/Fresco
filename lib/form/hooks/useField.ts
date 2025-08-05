import {
  type ChangeEvent,
  type ChangeEventHandler,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { type FieldValue } from '~/lib/interviewer/utils/field-validation';
import { useFormStore } from '../store/formStoreProvider';
import type { FieldConfig } from '../types';

export function useField(config: {
  name: string;
  initialValue?: FieldValue;
  validation?: FieldConfig['validation'];
}): {
  'value': FieldValue;
  'meta': {
    errors: string[] | null;
    isValidating: boolean;
    isTouched: boolean;
    isDirty: boolean;
    isValid: boolean;
  };
  'onChange': ChangeEventHandler<HTMLInputElement>;
  'onBlur': () => void;
  'data-field-name': string; // Used for scrolling to field errors
} {
  // Get the stable store API reference
  const isUnmountingRef = useRef(false);

  // Subscribe to the specific field state using Zustand's useStore hook
  const fieldState = useFormStore((state) => state.getFieldState(config.name));
  const registerField = useFormStore((store) => store.registerField);
  const unregisterField = useFormStore((store) => store.unregisterField);
  const setFieldValue = useFormStore((store) => store.setFieldValue);
  const setFieldTouched = useFormStore((store) => store.setFieldTouched);
  const validateField = useFormStore((store) => store.validateField);

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
    (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
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

  return {
    'value': fieldState?.value ?? config.initialValue ?? '',
    'meta': {
      errors: fieldState?.meta.errors ?? null,
      isValid: fieldState?.meta.isValid ?? false,
      isTouched: fieldState?.meta.isTouched ?? false,
      isDirty: fieldState?.meta.isDirty ?? false,
      isValidating: fieldState?.meta.isValidating ?? false,
    },
    'onChange': handleChange,
    'onBlur': handleBlur,
    'data-field-name': config.name, // Used for scrolling to field errors
  };
}
