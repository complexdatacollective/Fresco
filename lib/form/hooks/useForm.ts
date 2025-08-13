import {
  useCallback,
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type FormEvent,
} from 'react';
import { useFormStore } from '../store/formStoreProvider';
import type { FormConfig } from '../types';
import { FormSubmissionResultSchema } from '../types';

export function useForm(config: FormConfig): {
  formProps: ComponentProps<'form'> & {
    onSubmit: (e: FormEvent) => Promise<void>;
  };
  reset: () => void;
  formErrors: string[];
} {
  const registeredRef = useRef(false);
  const isUnmountingRef = useRef(false);

  const registerForm = useFormStore((state) => state.registerForm);
  const validateForm = useFormStore((state) => state.validateForm);
  const getFormValues = useFormStore((state) => state.getFormValues);
  const getFormErrors = useFormStore((state) => state.getFormErrors);
  const reset = useFormStore((state) => state.reset);
  const setFormErrors = useFormStore((state) => state.setFormErrors);
  const clearFormErrors = useFormStore((state) => state.clearFormErrors);
  const setFieldError = useFormStore((state) => state.setFieldError);
  const formErrors = useFormStore((state) => state.formErrors);

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
      e.preventDefault(); // Prevent default form submission
      setSubmitting(true);
      clearFormErrors();

      try {
        const isValid = await validateForm(); // Run field level validation

        if (!isValid) {
          const errors = getFormErrors();
          if (errors && configRef.current.onSubmitInvalid) {
            configRef.current.onSubmitInvalid(errors);
          }

          return;
        }

        const values = getFormValues();
        const result = await configRef.current.onSubmit?.(values);

        // Validate and handle form submission result
        if (result !== undefined && result !== null) {
          const parseResult = FormSubmissionResultSchema.safeParse(result);

          if (parseResult.success) {
            const validatedResult = parseResult.data;

            if (!validatedResult.success && validatedResult.errors) {
              // Set form-level errors
              if (
                'form' in validatedResult.errors &&
                validatedResult.errors.form
              ) {
                setFormErrors(validatedResult.errors.form);
              }

              // Set field-level errors
              if (
                'fields' in validatedResult.errors &&
                validatedResult.errors.fields
              ) {
                Object.entries(validatedResult.errors.fields).forEach(
                  ([fieldName, errors]) => {
                    if (errors && errors.length > 0) {
                      setFieldError(fieldName, errors.join(', '));
                    }
                  },
                );
              }
            }
          } else {
            // Invalid return format - treat as an error
            setFormErrors([
              'Form submission returned an invalid response format. Please contact support.',
            ]);
            // parseResult.error contains the validation errors if needed for debugging
          }
        }
      } catch (error) {
        // Handle form submission errors - treat as form-level error
        setFormErrors(['An unexpected error occurred. Please try again.']);
        // Silently handle error - it's already shown to the user
      } finally {
        setSubmitting(false);
      }
    },
    [
      setSubmitting,
      validateForm,
      getFormValues,
      getFormErrors,
      setFormErrors,
      clearFormErrors,
      setFieldError,
    ],
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
