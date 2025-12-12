import { useCallback, useLayoutEffect, useRef, type FormEvent } from 'react';
import type { FlattenedErrors, FormConfig } from '../components/types';
import { useFormStore } from '../store/formStoreProvider';

export function useForm(config: FormConfig) {
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
      const formConfig: FormConfig = {
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
      e.preventDefault(); // Prevent default form submission
      e.stopPropagation(); // Stop event propagation
      setSubmitting(true);
      setErrors(null);

      try {
        const isValid = await validateForm(); // Run field level validation
        if (!isValid) {
          // Wait a tick for the store to update with errors
          setTimeout(() => {
            const currentErrors = errorsRef.current;
            if (currentErrors && configRef.current.onSubmitInvalid) {
              configRef.current.onSubmitInvalid(currentErrors);
            }
          }, 0);

          return;
        }

        const values = getFormValues();
        // The schema is passed to onSubmit which provides type safety
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
        console.log('error', error);
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
