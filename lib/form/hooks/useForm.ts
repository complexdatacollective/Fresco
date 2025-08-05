import {
  useCallback,
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type FormEvent,
} from 'react';
import { useFormStore } from '../store/formStoreProvider';
import type { FormConfig } from '../types';

export function useForm(config: FormConfig): {
  formProps: ComponentProps<'form'> & {
    onSubmit: (e: FormEvent) => Promise<void>;
  };
  reset: () => void;
} {
  const registeredRef = useRef(false);
  const isUnmountingRef = useRef(false);

  const registerForm = useFormStore((state) => state.registerForm);
  const validateForm = useFormStore((state) => state.validateForm);
  const getFormValues = useFormStore((state) => state.getFormValues);
  const getFormErrors = useFormStore((state) => state.getFormErrors);
  const reset = useFormStore((state) => state.reset);

  const setSubmitting = useFormStore((state) => state.setSubmitting);

  // Store the latest config in a ref to avoid dependency issues
  const configRef = useRef(config);
  configRef.current = config;

  // Register form once on mount. layout effect used to ensure it runs before fields register.
  useLayoutEffect(() => {
    if (!registeredRef.current && !isUnmountingRef.current) {
      const formConfig: FormConfig = {
        onSubmit: configRef.current.onSubmit,
        onSubmitInvalid: configRef.current.onSubmitInvalid,
        additionalContext: configRef.current.additionalContext,
      };
      registerForm(formConfig);
      registeredRef.current = true;
    }

    return () => {
      isUnmountingRef.current = true;
      if (registeredRef.current) {
        reset();
        registeredRef.current = false;
      }
    };
  }, [reset, registerForm]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setSubmitting(true);

      try {
        const isValid = await validateForm();

        if (isValid) {
          const values = getFormValues();
          await configRef.current.onSubmit?.(values);
        } else {
          const errors = getFormErrors();
          if (errors && configRef.current.onSubmitInvalid) {
            configRef.current.onSubmitInvalid(errors);
          }
        }
      } catch (error) {
        // Handle form submission errors silently or with proper error handling
        // console.error('Form submission error:', error);
      } finally {
        setSubmitting(false);
      }
    },
    [setSubmitting, validateForm, getFormValues, getFormErrors],
  );

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  return {
    formProps: {
      onSubmit: handleSubmit,
    },
    reset: handleReset,
  };
}
