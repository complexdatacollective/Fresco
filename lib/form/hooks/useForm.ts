import { useCallback, useId, useLayoutEffect, useRef, type FormEvent } from 'react';
import { useFormStore } from '../store/formStore';
import type { FormConfig, FormErrors } from '../types';

export function useForm(config: Partial<FormConfig> & { name?: string }) {
  const formId = useId();
  const formName = config.name || formId;
  const registeredRef = useRef(false);

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
      const formConfig: FormConfig = {
        ...config,
        name: formName,
        onSubmit: config.onSubmit || (() => {}),
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
  }, [formName, registerForm, unregisterForm]); // Remove config from deps to prevent re-registration

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    incrementSubmitCount(formName);
    setSubmitting(formName, true);

    try {
      const isValid = await validateForm(formName);
      const values = getFormValues(formName);

      if (isValid) {
        await config.onSubmit?.(values);
      } else {
        const formState = getFormState(formName);
        if (formState && config.onSubmitInvalid) {
          const errors: FormErrors = {};
          Object.entries(formState.fields).forEach(
            ([fieldName, fieldState]) => {
              if (fieldState.error) {
                errors[fieldName] = fieldState.error;
              }
            },
          );
          config.onSubmitInvalid(errors);
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
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
    formContext: {
      formName,
      fieldContext: config.fieldContext,
      focusFirstInput: config.focusFirstInput,
      errors: getFormErrors(formName),
    },
    reset: handleReset,
  };
}
