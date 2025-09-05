import { useCallback, useLayoutEffect, useRef, type FormEvent } from 'react';
import type z from 'zod';
import { useFormStore } from '../store/formStoreProvider';
import type { FormConfig } from '../types';

export function useForm<TValues extends z.ZodType>(
  config: FormConfig<TValues>,
) {
  const registeredRef = useRef(false);
  const isUnmountingRef = useRef(false);
  const configRef = useRef(config); // Config is static, so this avoids needing to specify it in effect deps
  configRef.current = config;

  const registerForm = useFormStore((state) => state.registerForm);
  const validateForm = useFormStore((state) => state.validateForm);
  const getFormValues = useFormStore((state) => state.getFormValues);
  const getFormErrors = useFormStore((state) => state.getFormErrors);
  const reset = useFormStore((state) => state.reset);
  const setFormErrors = useFormStore((state) => state.setFormErrors);
  const formErrors = useFormStore((state) => state.formErrors);
  const setSubmitting = useFormStore((state) => state.setSubmitting);

  // Register form once on mount. layout effect used to ensure it runs before fields register.
  useLayoutEffect(() => {
    if (!registeredRef.current && !isUnmountingRef.current) {
      const formConfig: FormConfig<TValues> = {
        onSubmit: configRef.current.onSubmit,
        onSubmitInvalid: configRef.current.onSubmitInvalid,
        additionalContext: configRef.current.additionalContext,
      };
      registerForm(formConfig as unknown as Parameters<typeof registerForm>[0]);
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
      e.preventDefault(); // Prevent default form submission
      setSubmitting(true);
      setFormErrors(null);

      try {
        const isValid = await validateForm(); // Run field level validation

        if (!isValid) {
          const errors = getFormErrors();
          if (errors && configRef.current.onSubmitInvalid) {
            configRef.current.onSubmitInvalid(
              errors as z.ZodError<z.infer<TValues>>,
            );
          }

          return;
        }

        const values = getFormValues();
        // The schema is passed to onSubmit which provides type safety
        const result = await configRef.current.onSubmit?.(
          values,
          {} as TValues,
        );

        // Handle the submission result
        if (result && !result.success && result.errors) {
          setFormErrors(result.errors);
        }
      } catch (error) {
        // Handle form submission errors
        setFormErrors(null); // Clear any previous form errors
      } finally {
        setSubmitting(false);
      }
    },
    [setSubmitting, validateForm, getFormValues, getFormErrors, setFormErrors],
  );

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  return {
    formProps: {
      onSubmit: handleSubmit,
    },
    reset: handleReset,
    formErrors,
  };
}
