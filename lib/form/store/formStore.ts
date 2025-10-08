import { enableMapSet } from 'immer';
import { z, type ZodAny, type ZodError } from 'zod';
import { immer } from 'zustand/middleware/immer';
import { createStore } from 'zustand/vanilla';
import type {
  FieldConfig,
  FieldState,
  FieldValue,
  FormConfig,
  FormSubmitHandler,
} from '../types';
import { setValue } from '../utils/objectPath';
import { validateFieldValue } from '../utils/validation';

// Enable Map/Set support in Immer
enableMapSet();

export type FormStore<T extends z.ZodType> = {
  fields: Map<string, FieldState>;
  // Single unified error store - all errors from validation and submission
  errors: ZodError<z.infer<T>> | null;
  isSubmitting: boolean;
  isValidating: boolean;
  isDirty: boolean;
  isValid: boolean;
  context: Record<string, unknown>;
  submitHandler: FormSubmitHandler<T> | null;
  submitInvalidHandler: ((errors: ZodError<z.infer<T>>) => void) | null;

  // Form management
  registerForm: (config: FormConfig<T>) => void;
  reset: () => void;

  // Field management
  registerField: (config: FieldConfig) => void;
  unregisterField: (fieldName: string) => void;

  // Field state updates
  setFieldValue: (fieldName: string, value: FieldValue) => void;
  setFieldTouched: (fieldName: string, touched: boolean) => void;

  setErrors: (errors: ZodError<z.infer<T>> | null) => void;

  // Getters with selective subscription
  getFieldState: (fieldName: string) => FieldState | undefined;
  getFormValues: () => Record<string, FieldValue>;
  getFormErrors: () => string[] | null;
  getFieldErrors: (fieldName: string) => string[] | null;

  // Validation
  validateField: (fieldName: string) => Promise<void>;
  validateForm: () => Promise<boolean>;

  // Form submission
  setSubmitting: (submitting: boolean) => void;
  submitForm: () => Promise<void>;

  // Form reset
  resetForm: () => void;
  resetField: (fieldName: string) => void;
};
export type FormStoreApi = ReturnType<typeof createFormStore>;

export const createFormStore = <T extends z.ZodType = ZodAny>() => {
  return createStore<FormStore<T>>()(
    immer((set, get, _store) => ({
      fields: new Map(),
      errors: null,

      isSubmitting: false,
      isValidating: false,
      isDirty: false,
      isValid: true,

      context: {},
      submitHandler: null,
      submitInvalidHandler: null,

      registerForm: (config) => {
        set((state) => {
          state.submitHandler = config.onSubmit;
          state.submitInvalidHandler = config.onSubmitInvalid ?? null;
        });
      },

      reset: () => {
        set((state) => {
          state.fields.clear();
          state.errors = null;
          state.isSubmitting = false;
          state.isValidating = false;
          state.isDirty = false;
          state.isValid = true;
          state.submitHandler = null;
          state.submitInvalidHandler = null;
          state.context = {};
        });
      },

      registerField: (config) => {
        set((state) => {
          const fieldState: FieldState = {
            ...config,
            value: config.initialValue ?? undefined, // TODO: should this get default initial value for type?
            meta: {
              errors: null,
              isValidating: false,
              isTouched: false,
              isDirty: false,
              isValid: false,
            },
          };

          // Store field state with dot notation key (flat structure)
          state.fields.set(config.name, fieldState);
        });
      },

      unregisterField: (fieldName) => {
        // Check if field exists before updating to avoid unnecessary renders
        const currentState = get();
        if (currentState.fields.has(fieldName)) {
          set((state) => {
            state.fields.delete(fieldName);
          });
        }
      },

      setErrors: (errors: ZodError<z.infer<T>> | null) => {
        set((state) => {
          // Store as a plain object that can be handled by Immer
          state.errors = errors as any;
        });
      },

      setFieldValue: (fieldName, value) => {
        set((state) => {
          if (!state.fields.get(fieldName)) {
            // eslint-disable-next-line no-console
            console.warn(`Field "${fieldName}" is not registered.`);
            return;
          }

          state.fields.get(fieldName)!.value = value;
          state.fields.get(fieldName)!.meta.isDirty = true;
        });
      },

      setFieldTouched: (fieldName, touched) => {
        set((state) => {
          if (!state.fields.get(fieldName)) return;

          state.fields.get(fieldName)!.meta.isTouched = touched;
        });
      },

      getFieldState: (fieldName) => {
        const state = get();
        return state.fields.get(fieldName);
      },

      getFormValues: () => {
        const state = get();
        const values = {};
        Array.from(state.fields.entries()).forEach(
          ([fieldName, fieldState]) => {
            setValue(values, fieldName, fieldState.value);
          },
        );
        return values as Record<string, FieldValue>;
      },

      getFormErrors: () => {
        const state = get();
        if (!state.errors) return null;

        // Extract form-level errors (those with empty path)
        const formErrors = state.errors.issues
          .filter((issue) => issue.path.length === 0)
          .map((issue) => issue.message);

        return formErrors.length > 0 ? formErrors : null;
      },

      getFieldErrors: (fieldName: string) => {
        const state = get();
        if (!state.errors) return null;

        // Extract errors for specific field based on path
        const fieldErrors = state.errors.issues
          .filter((issue) => {
            // Check if the error path matches the field name
            // Handle both direct field matches and nested path matches
            return (
              issue.path.length > 0 &&
              (issue.path[0] === fieldName ||
                issue.path.join('.') === fieldName)
            );
          })
          .map((issue) => issue.message);

        return fieldErrors.length > 0 ? fieldErrors : null;
      },
      validateField: async (fieldName) => {
        const state = get();
        const field = state.getFieldState(fieldName);
        if (!field?.validation) return;

        set((draft) => {
          const form = draft;
          if (form?.fields.get(fieldName)) {
            form.fields.get(fieldName)!.meta.isValidating = true;
          }
        });

        try {
          set((draft) => {
            const form = draft;
            if (form?.fields.get(fieldName)) {
              form.fields.get(fieldName)!.meta.isValidating = true;
            }
          });

          const result = await validateFieldValue(
            field.value,
            field.validation,
            state.getFormValues(),
          );

          if (!result.success) {
            set((draft) => {
              const form = draft;
              if (form?.fields.get(fieldName)) {
                form.fields.get(fieldName)!.meta.errors =
                  result.error.issues.map((i) => i.message);
                form.fields.get(fieldName)!.meta.isValid = false;

                // Update form-level isValid to
                form.isValid = Array.from(form.fields.values()).every(
                  (field) => field.meta.isValid,
                );
              }
            });
          } else {
            set((draft) => {
              const form = draft;
              if (form?.fields.get(fieldName)) {
                form.fields.get(fieldName)!.meta.isValidating = false;
                form.fields.get(fieldName)!.meta.isValid = true;
                form.fields.get(fieldName)!.meta.errors = null;

                // Update form-level isValid to
                form.isValid = Array.from(form.fields.values()).every(
                  (field) => field.meta.isValid,
                );
              }
            });
          }
        } catch (err) {
          set((draft) => {
            const form = draft;
            if (form?.fields.get(fieldName)) {
              form.fields.get(fieldName)!.meta.errors = [
                'Something went wrong during validation',
              ];
              form.fields.get(fieldName)!.meta.isValid = false;
              form.fields.get(fieldName)!.meta.isValidating = false;

              // Update form-level isValid to
              form.isValid = Array.from(form.fields.values()).every(
                (field) => field.meta.isValid,
              );
            }
          });
        }
      },

      validateForm: async () => {
        const state = get();
        const fields = state.fields;
        const allErrors: z.core.$ZodIssue[] = [];

        // First validate all fields
        const fieldValidationPromises = Array.from(fields.entries()).map(
          async ([fieldName, fieldState]) => {
            if (!fieldState?.validation) return { fieldName, success: true };

            const result = await validateFieldValue(
              fieldState.value,
              fieldState.validation,
              state.getFormValues(),
            );

            return { fieldName, result };
          },
        );

        const fieldResults = await Promise.all(fieldValidationPromises);

        // Process validation results and collect errors for unified store
        // Do NOT update field.meta.errors here to avoid infinite loop
        fieldResults.forEach(({ fieldName, result }) => {
          if (result && !result.success) {
            // Field has validation errors
            // Add errors to the allErrors array with the field path
            result.error.issues.forEach((issue) => {
              allErrors.push({
                ...issue,
              });
            });

            // Mark field as touched so errors will show
            set((draft) => {
              const field = draft.fields.get(fieldName);
              if (field) {
                field.meta.isTouched = true;
                field.meta.isValid = false;
              }
            });
          } else if (result?.success) {
            // Field is valid
            set((draft) => {
              const field = draft.fields.get(fieldName);
              if (field) {
                field.meta.isValid = true;
              }
            });
          }
        });

        // Create a ZodError if there are any validation errors
        if (allErrors.length > 0) {
          const zodError = new z.ZodError(allErrors);
          set((draft) => {
            // Cast to any to bypass Immer's type checking for complex objects
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (draft.errors as any) = zodError;
            draft.isValid = false;
          });
        } else {
          set((draft) => {
            draft.errors = null;
            draft.isValid = true;
          });
        }

        return allErrors.length === 0;
      },

      setSubmitting: (submitting) => {
        set((state) => {
          const form = state;
          if (!form) return;

          form.isSubmitting = submitting;
        });
      },

      submitForm: async () => {
        const state = get();

        if (!state.submitHandler) {
          // eslint-disable-next-line no-console
          console.warn('No submit handler registered');
          return;
        }

        const values = state.getFormValues();
        await state.submitHandler(values);
      },

      resetForm: () => {
        set((state) => {
          const form = state;
          const fields = state.fields;

          if (!form || !fields) return;

          // Reset all fields to their initial values
          Array.from(fields.keys()).forEach((fieldName) => {
            state.resetField(fieldName);
          });

          // Reset form-level state
          form.errors = null;
          form.isSubmitting = false;
          form.isValidating = false;
          form.isValid = true;
        });
      },

      resetField: (fieldName) => {
        set((state) => {
          const form = state;
          const fields = state.fields;

          if (
            !form ||
            !fields ||
            !Array.from(fields.keys()).includes(fieldName)
          )
            return;

          const fieldConfig = fields.get(fieldName);
          const initialValue = fieldConfig?.initialValue ?? '';

          fields.set(fieldName, {
            ...fieldConfig!,
            value: initialValue,
            meta: {
              errors: null,
              isValidating: false,
              isTouched: false,
              isDirty: false,
              isValid: true,
            },
          });

          // Update form-level isValid
          form.isValid = Array.from(form.fields.keys()).every(
            (fieldName) => fields.get(fieldName)?.meta.isValid,
          );
        });
      },
    })),
  );
};
