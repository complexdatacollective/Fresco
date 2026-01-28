import { useCallback, useLayoutEffect, useRef, type FormEvent } from 'react';
import type { FlattenedErrors, FormConfig } from '../store/types';
import useFormStore from './useFormStore';

export function useForm(config: FormConfig) {
  const registeredRef = useRef(false);
  const isUnmountingRef = useRef(false);
  const configRef = useRef(config); // Config is static, so this avoids needing to specify it in effect deps
  configRef.current = config;
  // Store errors are always an object (never null)
  const errorsRef = useRef<FlattenedErrors>({
    formErrors: [],
    fieldErrors: {},
  });

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
      registerForm({
        onSubmit: configRef.current.onSubmit,
        onSubmitInvalid: configRef.current.onSubmitInvalid,
      });
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
      e.stopPropagation();
      setSubmitting(true);

      try {
        const isValid = await validateForm(); // Run field level validation
        if (!isValid) {
          // Wait a tick for the store to update with errors
          setTimeout(() => {
            if (configRef.current.onSubmitInvalid) {
              configRef.current.onSubmitInvalid(errorsRef.current);
            }
          }, 0);

          return;
        }

        const values = getFormValues();

        const result = await configRef.current.onSubmit?.(values);

        if (result.success) {
          // Clear errors on successful submission
          setErrors(null);
          return;
        }

        // Handle the submission result
        setErrors({
          formErrors: result.formErrors ?? [],
          fieldErrors: result.fieldErrors ?? {},
        });
      } catch (error) {
        setErrors({
          formErrors: ['An error occurred while submitting the form.'],
          fieldErrors: {},
        });
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
