import { useCallback, useLayoutEffect, useRef, type FormEvent } from 'react';
import type z from 'zod';
import { useFormStore } from '../store/formStoreProvider';
import type { FlattenedErrors, FormConfig } from '../types';

export function useForm<TValues extends z.ZodType>(
  config: FormConfig<TValues>,
) {
  const registeredRef = useRef(false);
  const isUnmountingRef = useRef(false);
  const configRef = useRef(config); // Config is static, so this avoids needing to specify it in effect deps
  configRef.current = config;
  const errorsRef = useRef<FlattenedErrors | null>(null);

  const registerForm = useFormStore((state) => state.registerForm);
  const validateForm = useFormStore((state) => state.validateForm);
  const getFormValues = useFormStore((state) => state.getFormValues);
  const getFormErrors = useFormStore((state) => state.getFormErrors);
  const reset = useFormStore((state) => state.reset);
  const setErrors = useFormStore((state) => state.setErrors);
  const setSubmitting = useFormStore((state) => state.setSubmitting);
  const errors = useFormStore((state) => state.errors);

  // Keep errors ref in sync with store using useEffect
  useLayoutEffect(() => {
    errorsRef.current = errors;
  }, [errors]);

  // Register form once on mount. layout effect used to ensure it runs before fields register.
  useLayoutEffect(() => {
    if (!registeredRef.current && !isUnmountingRef.current) {
      const formConfig: FormConfig<TValues> = {
        onSubmit: configRef.current.onSubmit,
        onSubmitInvalid: configRef.current.onSubmitInvalid,
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
      console.log('Form handleSubmit');
      e.preventDefault(); // Prevent default form submission
      setSubmitting(true);
      setErrors(null);

      try {
        const isValid = await validateForm(); // Run field level validation

        if (!isValid) {
          console.log('Form validation failed');
          // Wait a tick for the store to update with errors
          setTimeout(() => {
            const currentErrors = errorsRef.current;
            console.log('Form errors:', currentErrors);
            if (currentErrors && configRef.current.onSubmitInvalid) {
              console.log('Calling onSubmitInvalid callback');
              configRef.current.onSubmitInvalid(currentErrors);
            }
          }, 0);

          return;
        }

        const values = getFormValues();
        // The schema is passed to onSubmit which provides type safety
        const result = await configRef.current.onSubmit?.(values);

        // Handle the submission result
        if (result && !result.success && result.errors) {
          const flattened = result.errors.flatten();
          setErrors({
            formErrors: flattened.formErrors,
            fieldErrors: flattened.fieldErrors as Record<string, string[]>,
          });
        }
      } catch (error) {
        // Handle form submission errors
        setErrors(null); // Clear any previous form errors
      } finally {
        setSubmitting(false);
      }
    },
    [setSubmitting, validateForm, getFormValues, setErrors],
  );

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  // Extract form-level errors from the unified error store
  const formErrors = getFormErrors();

  return {
    formProps: {
      onSubmit: handleSubmit,
    },
    reset: handleReset,
    formErrors,
  };
}
