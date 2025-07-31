import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  type FormEvent,
} from 'react';
import { useFormStore } from '../store/formStore';
import type { FormConfig, FormErrors } from '../types';

export function useForm<TContext = unknown>(config: FormConfig<TContext>) {
  const formId = useId();
  const formName = config.name ?? formId;
  const registeredRef = useRef(false);

  // Store the latest config in a ref to avoid dependency issues
  const configRef = useRef(config);
  configRef.current = config;

  const {
    registerForm,
    unregisterForm,
    getFormState,
    getFormValues,
    getFormErrors,
    validateForm,
    setSubmitting,
    incrementSubmitCount,
    resetForm,
  } = useFormStore();

  // Register form once on mount
  useLayoutEffect(() => {
    if (!registeredRef.current) {
      const formConfig: FormConfig<TContext> = {
        name: formName,
        onSubmit: configRef.current.onSubmit,
        onSubmitInvalid: configRef.current.onSubmitInvalid,
        focusFirstInput: configRef.current.focusFirstInput,
        additionalContext: configRef.current.additionalContext,
        validation: configRef.current.validation,
      };
      registerForm(formName, formConfig);
      registeredRef.current = true;
    }

    return () => {
      if (registeredRef.current) {
        unregisterForm(formName);
        registeredRef.current = false;
      }
    };
  }, [formName, registerForm, unregisterForm]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    incrementSubmitCount(formName);
    setSubmitting(formName, true);

    try {
      const isValid = await validateForm(formName);
      const values = getFormValues(formName);

      if (isValid) {
        await configRef.current.onSubmit?.(values);
      } else {
        const formState = getFormState(formName);
        if (formState && configRef.current.onSubmitInvalid) {
          const errors: FormErrors = {};
          Object.entries(formState.fields).forEach(
            ([fieldName, fieldState]) => {
              if (fieldState.meta.error) {
                errors[fieldName] = fieldState.meta.error;
              }
            },
          );
          configRef.current.onSubmitInvalid(errors);
        }
      }
    } catch (error) {
      // Handle form submission errors silently or with proper error handling
      // console.error('Form submission error:', error);
    } finally {
      setSubmitting(formName, false);
    }
  };

  const handleReset = useCallback(() => {
    resetForm(formName);
  }, [resetForm, formName]);

  return {
    formProps: {
      'onSubmit': handleSubmit,
      'data-form-name': formName,
    },
    formName,
    context: {
      formName,
      additionalContext: configRef.current.additionalContext,
      focusFirstInput: configRef.current.focusFirstInput,
      errors: getFormErrors(formName),
    },
    reset: handleReset,
  };
}
