import { useCallback, useEffect, useMemo } from 'react';
import { useDebounceCallback } from 'usehooks-ts';
import { useFormContext } from '../context/FormContext';
import { useFormStore } from '../store/formStore';
import type { FieldConfig, ValidationContext } from '../types';

export function useField<TContext = unknown>(config: {
  name: string;
  initialValue?: unknown;
  validation?: FieldConfig<TContext>['validation'];
}) {
  const formContext = useFormContext<TContext>();
  const formName = formContext.formName;

  const {
    registerField,
    unregisterField,
    setValue,
    setTouched,
    setDirty,
    getFormValues,
    getFieldState,
    validateField,
  } = useFormStore();

  const validationContext: ValidationContext<TContext> = useMemo(
    () => ({
      additionalContext: formContext.additionalContext,
      formValues: getFormValues(formName),
    }),
    [formContext.additionalContext, formName, getFormValues],
  );

  // Register field on mount - use useLayoutEffect to ensure it runs after form registration
  useEffect(() => {
    registerField(formName, config.name, {
      initialValue: config.initialValue,
      validation: config.validation,
    });
    return () => {
      unregisterField(formName, config.name);
    };
  }, [
    formName,
    config.name,
    config.initialValue,
    config.validation,
    registerField,
    unregisterField,
  ]);

  // Selective subscription to field state
  const fieldState = getFieldState(formName, config.name);

  // Create debounced validation function
  const debouncedValidation = useDebounceCallback(validateField, 100, {
    leading: true,
    trailing: true,
  });

  const handleChange = useCallback(
    (value: unknown) => {
      setValue(formName, config.name, value);
      setDirty(formName, config.name, true);

      if (debouncedValidation) {
        void debouncedValidation(formName, config.name, validationContext);
      }
    },
    [
      formName,
      config.name,
      setValue,
      setDirty,
      debouncedValidation,
      validationContext,
    ],
  );

  const handleBlur = useCallback(() => {
    setTouched(formName, config.name, true);

    void debouncedValidation(formName, config.name, validationContext);
  }, [
    formName,
    config.name,
    setTouched,
    validationContext,
    debouncedValidation,
  ]);

  return {
    'value': fieldState?.value ?? config.initialValue ?? '',
    'meta': {
      error: fieldState?.meta.error ?? null,
      isValid: fieldState?.meta.isValid ?? true,
      isTouched: fieldState?.meta.isTouched ?? false,
      isDirty: fieldState?.meta.isDirty ?? false,
      isValidating: fieldState?.meta.isValidating ?? false,
    },
    'onChange': handleChange,
    'onBlur': handleBlur,
    'data-field-name': config.name, // Used for scrolling to field errors
  };
}
