import { enableMapSet } from 'immer';
import { immer } from 'zustand/middleware/immer';
import { createStore } from 'zustand/vanilla';
import type {
  FieldConfig,
  FieldState,
  FieldValue,
  FlattenedErrors,
  FormConfig,
  FormSubmitHandler,
} from '../types';
import { setValue } from '../utils/objectPath';
import { validateFieldValue } from '../utils/validation';

// Enable Map/Set support in Immer
enableMapSet();

export type FormStore = {
  fields: Map<string, FieldState>;
  errors: FlattenedErrors | null;
  isSubmitting: boolean;
  isValidating: boolean;
  isDirty: boolean;
  isValid: boolean;
  context: Record<string, unknown>;
  submitHandler: FormSubmitHandler | null;
  submitInvalidHandler: ((errors: FlattenedErrors) => void) | null;

  // Form management
  registerForm: (config: FormConfig) => void;
  reset: () => void;

  // Field management
  registerField: (config: FieldConfig) => void;
  unregisterField: (fieldName: string) => void;

  // Field state updates
  setFieldValue: (fieldName: string, value: FieldValue) => void;
  setFieldTouched: (fieldName: string, touched: boolean) => void;

  setErrors: (errors: FlattenedErrors | null) => void;

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

export const createFormStore = () => {
  return createStore<FormStore>()(
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
            state: {
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

      setErrors: (errors: FlattenedErrors | null) => {
        set((state) => {
          state.errors = errors;
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
          state.fields.get(fieldName)!.state.isDirty = true;
          state.fields.get(fieldName)!.state.isTouched = true;
          state.isDirty = true;

          // Validate field by calling validateField
          void state.validateField(fieldName);
        });
      },

      setFieldTouched: (fieldName, touched) => {
        set((state) => {
          if (!state.fields.get(fieldName)) return;

          state.fields.get(fieldName)!.state.isTouched = touched;
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

        // Return form-level errors from flattened structure
        const formErrors = state.errors.formErrors;
        return formErrors.length > 0 ? formErrors : null;
      },

      getFieldErrors: (fieldName: string) => {
        const state = get();
        if (!state.errors) return null;

        // Return field errors from flattened structure
        const fieldErrors = state.errors.fieldErrors[fieldName];
        return fieldErrors && fieldErrors.length > 0 ? fieldErrors : null;
      },
      validateField: async (fieldName) => {
        const state = get();
        const field = state.fields.get(fieldName);
        if (!field?.validation) return;

        set((draft) => {
          const form = draft;
          if (form?.fields.get(fieldName)) {
            form.fields.get(fieldName)!.state.isValidating = true;
          }
        });

        try {
          const result = await validateFieldValue(
            field.value,
            field.validation,
            state.getFormValues(),
          );

          if (!result.success) {
            set((draft) => {
              const form = draft;
              const field = form?.fields.get(fieldName);
              if (field) {
                field.state.isValidating = false;
                field.state.isValid = false;

                const prevFormErrors = form.errors ?? {
                  formErrors: [],
                  fieldErrors: {},
                };

                form.errors = {
                  ...prevFormErrors,
                  fieldErrors: {
                    ...prevFormErrors.fieldErrors,
                    [fieldName]: result.error.issues.map(
                      (issue) => issue.message,
                    ),
                  },
                };

                // Update form-level isValid
                form.isValid = Array.from(form.fields.values()).every(
                  (field) => field.state.isValid,
                );
              }
            });
          } else {
            set((draft) => {
              const form = draft;
              if (form?.fields.get(fieldName)) {
                form.fields.get(fieldName)!.state.isValidating = false;
                form.fields.get(fieldName)!.state.isValid = true;

                // Remove errors for this field from the unified error store
                if (form.errors) {
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const { [fieldName]: _removed, ...remainingFieldErrors } =
                    form.errors.fieldErrors;

                  // Check if there are any errors left
                  if (
                    Object.keys(remainingFieldErrors).length === 0 &&
                    form.errors.formErrors.length === 0
                  ) {
                    form.errors = null;
                  } else {
                    form.errors = {
                      formErrors: form.errors.formErrors,
                      fieldErrors: remainingFieldErrors,
                    };
                  }
                }

                // Update form-level isValid
                form.isValid = Array.from(form.fields.values()).every(
                  (field) => field.state.isValid,
                );
              }
            });
          }
        } catch (err) {
          set((draft) => {
            const form = draft;
            if (form?.fields.get(fieldName)) {
              form.fields.get(fieldName)!.state.isValid = false;
              form.fields.get(fieldName)!.state.isValidating = false;

              // Add error to the unified error store
              const currentErrors = form.errors ?? {
                formErrors: [],
                fieldErrors: {},
              };

              form.errors = {
                formErrors: currentErrors.formErrors,
                fieldErrors: {
                  ...currentErrors.fieldErrors,
                  [fieldName]: ['Something went wrong during validation'],
                },
              };

              // Update form-level isValid
              form.isValid = Array.from(form.fields.values()).every(
                (field) => field.state.isValid,
              );
            }
          });
        }
      },

      validateForm: async () => {
        const state = get();
        const fields = state.fields;
        const fieldErrors: Record<string, string[]> = {};

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

        // Process validation results and collect errors
        fieldResults.forEach(({ fieldName, result }) => {
          if (result && !result.success) {
            // Field has validation errors - flatten and collect
            const flattened = result.error.flatten();
            // Errors can be in formErrors (no path) or fieldErrors (with nested paths)
            // Combine them for this field
            const combinedErrors = [
              ...flattened.formErrors,
              ...(flattened.fieldErrors[fieldName] ?? []),
            ] as string[];
            if (combinedErrors.length > 0) {
              fieldErrors[fieldName] = combinedErrors;
            }

            // Mark field as touched so errors will show
            set((draft) => {
              const field = draft.fields.get(fieldName);
              if (field) {
                field.state.isTouched = true;
                field.state.isValid = false;
              }
            });
          } else if (result?.success) {
            // Field is valid
            set((draft) => {
              const field = draft.fields.get(fieldName);
              if (field) {
                field.state.isValid = true;
              }
            });
          }
        });

        // Update the unified error store
        if (Object.keys(fieldErrors).length > 0) {
          set((draft) => {
            draft.errors = {
              formErrors: [], // Form-level validation happens separately
              fieldErrors,
            };
            draft.isValid = false;
          });
        } else {
          set((draft) => {
            draft.errors = null;
            draft.isValid = true;
          });
        }

        return Object.keys(fieldErrors).length === 0;
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
            state: {
              isValidating: false,
              isTouched: false,
              isDirty: false,
              isValid: true,
            },
          });

          // Remove errors for this field from the unified error store
          if (form.errors) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [fieldName]: _removed, ...remainingFieldErrors } =
              form.errors.fieldErrors;

            // Check if there are any errors left
            if (
              Object.keys(remainingFieldErrors).length === 0 &&
              form.errors.formErrors.length === 0
            ) {
              form.errors = null;
            } else {
              form.errors = {
                formErrors: form.errors.formErrors,
                fieldErrors: remainingFieldErrors,
              };
            }
          }

          // Update form-level isValid
          form.isValid = Array.from(form.fields.keys()).every(
            (fieldName) => fields.get(fieldName)?.state.isValid,
          );
        });
      },
    })),
  );
};
