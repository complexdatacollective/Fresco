import { useCallback, useEffect, useRef, type ChangeEventHandler } from 'react';
import { useFormContext } from '../context/FormContext';
import { useFormStore } from '../store/formStore';
import type { FieldConfig, ValidationContext } from '../types';
import { debounce } from '../utils/validation';

export function useField(config: {
  name: string;
  initialValue?: any;
  validation?: FieldConfig['validation'];
}) {
  const formContext = useFormContext();
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

  // Register field on mount - use useLayoutEffect to ensure it runs after form registration
  useEffect(() => {
    // Use setTimeout to ensure this runs after form registration useLayoutEffect
    const timeoutId = setTimeout(() => {
      registerField(formName, config.name, {
        initialValue: config.initialValue,
        validation: config.validation,
      });
    }, 0);

    return () => {
      clearTimeout(timeoutId);
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
  const debouncedValidationRef = useRef<ReturnType<typeof debounce>>();

  useEffect(() => {
    debouncedValidationRef.current = debounce((value: any) => {
      const validationContext: ValidationContext = {
        formContext: formContext.fieldContext,
        fieldContext: formContext.fieldContext,
        formValues: getFormValues(formName),
      };

      void validateField(formName, config.name, validationContext);
    }, 300); // 300ms debounce delay
  }, [formName, config.name, validateField, formContext, getFormValues]);

  const handleChange = useCallback(
    (value: ChangeEventHandler<HTMLInputElement>) => {
      setValue(formName, config.name, value);
      setDirty(formName, config.name, true);

      // Trigger debounced validation on change
      if (debouncedValidationRef.current) {
        debouncedValidationRef.current(value);
      }
    },
    [formName, config.name, setValue, setDirty],
  );

  const handleBlur = useCallback(() => {
    console.log('Field blurred:', config.name);
    setTouched(formName, config.name, true);

    // Trigger validation on blur
    const validationContext: ValidationContext = {
      formContext: formContext.fieldContext,
      fieldContext: formContext.fieldContext,
      formValues: getFormValues(formName),
    };

    void validateField(formName, config.name, validationContext);
  }, [
    formName,
    config.name,
    setTouched,
    validateField,
    formContext,
    getFormValues,
  ]);

  return {
    value: fieldState?.value ?? config.initialValue ?? '',
    error: fieldState?.error ?? null,
    isValid: fieldState?.isValid ?? true,
    isTouched: fieldState?.isTouched ?? false,
    isDirty: fieldState?.isDirty ?? false,
    isValidating: fieldState?.isValidating ?? false,
    onChange: handleChange,
    onBlur: handleBlur,
  };
}
