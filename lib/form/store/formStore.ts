import { enableMapSet } from 'immer';
import type z from 'zod';
import { type ZodAny, ZodError } from 'zod';
import { immer } from 'zustand/middleware/immer';
import { createStore } from 'zustand/vanilla';
import type {
  FieldConfig,
  FieldState,
  FieldValue,
  FormConfig,
  FormSubmitHandler,
  ValidationContext,
} from '../types';
import { setValue } from '../utils/objectPath';
import { validateFieldValue } from '../utils/validation';

// Enable Map/Set support in Immer
enableMapSet();

export type FormStore<T extends z.ZodType> = {
  fields: Map<string, FieldState>;
  formErrors: z.ZodError<z.infer<T>> | null;
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
  setFieldError: (
    fieldName: string,
    error: ZodError<z.infer<T>> | null,
  ) => void;
  setFieldTouched: (fieldName: string, touched: boolean) => void;
  setFieldDirty: (fieldName: string, dirty: boolean) => void;

  // Form errors
  setFormErrors: (errors: ZodError<z.infer<T>> | null) => void;

  // Getters with selective subscription
  getFieldState: (fieldName: string) => FieldState | undefined;
  getFormValues: () => Record<string, FieldValue>;
  getFormErrors: () => ZodError<z.infer<T>> | null;

  // Validation
  validateField: (fieldName: string) => Promise<void>;
  validateForm: () => Promise<boolean>;

  // Form submission
  setSubmitting: (submitting: boolean) => void;

  // Form reset
  resetForm: () => void;
  resetField: (fieldName: string) => void;
};
export type FormStoreApi = ReturnType<typeof createFormStore>;

export const createFormStore = <T extends z.ZodType = ZodAny>() => {
  return createStore<FormStore<T>>()(
    immer((set, get, _store) => ({
      fields: new Map(),
      formErrors: null,

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
          state.context = config.additionalContext ?? {};
        });
      },

      reset: () => {
        set((state) => {
          state.fields.clear();
          state.formErrors = null;
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

      setFieldError: (fieldName, error) => {
        set((state) => {
          if (!state.fields.get(fieldName)) return;

          state.fields.get(fieldName)!.meta.errors = error;
          state.fields.get(fieldName)!.meta.isValid = !error;

          // Update form-level isValid
          state.isValid = Array.from(state.fields.values()).every(
            (field) => field.meta.isValid,
          );
        });
      },

      setFieldTouched: (fieldName, touched) => {
        set((state) => {
          if (!state.fields.get(fieldName)) return;

          state.fields.get(fieldName)!.meta.isTouched = touched;
        });
      },

      setFieldDirty: (fieldName, dirty) => {
        set((state) => {
          if (!state.fields.get(fieldName)) return;

          state.fields.get(fieldName)!.meta.isDirty = dirty;

          // Update form-level isDirty
          state.isDirty = Array.from(state.fields.values()).some(
            (field) => field.meta.isDirty,
          );
        });
      },

      setFormErrors: (errors) => {
        set((state) => {
          state.formErrors = errors;
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
        return state.formErrors;
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
          // Validation context is context plus field values
          const validationContext: ValidationContext = {
            ...state.context,
            formValues: state.getFormValues(),
          };

          set((draft) => {
            const form = draft;
            if (form?.fields.get(fieldName)) {
              form.fields.get(fieldName)!.meta.isValidating = true;
            }
          });

          const result = await validateFieldValue(
            field.value,
            field.validation,
            validationContext,
          );

          if (!result.success) {
            set((draft) => {
              const form = draft;
              if (form?.fields.get(fieldName)) {
                form.fields.get(fieldName)!.meta.errors = result.error;
                form.fields.get(fieldName)!.meta.isValid = false;
              }
            });
          } else {
            set((draft) => {
              const form = draft;
              if (form?.fields.get(fieldName)) {
                form.fields.get(fieldName)!.meta.isValidating = false;
                form.fields.get(fieldName)!.meta.isValid = true;
                form.fields.get(fieldName)!.meta.errors = null;
                // Update form-level isValid
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
              const error = new ZodError([
                {
                  code: 'custom',
                  message: 'Something went wrong during validation',
                  path: [],
                },
              ]);

              form.fields.get(fieldName)!.meta.errors = error;
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

        // First validate all fields
        const fieldValidationPromises = Array.from(fields.entries()).map(
          async ([fieldName, fieldState]) => {
            if (!fieldState?.validation) return true;

            const context = {
              ...state.context,
              formValues: state.getFormValues(),
            } as ValidationContext;

            const result = await validateFieldValue(
              fieldState.value,
              fieldState.validation,
              context,
            );

            // Update field state with validation result
            if (!result.success) {
              set((draft) => {
                const draftForm = draft;
                if (draftForm?.fields) {
                  draftForm.fields.get(fieldName)!.meta.errors = result.error;
                  draftForm.fields.get(fieldName)!.meta.isValid = false;

                  // Set all fields as touched to trigger showing validation errors
                  draftForm.fields.get(fieldName)!.meta.isTouched = true;
                }
              });
            }

            return result.success;
          },
        );

        const fieldResults = await Promise.all(fieldValidationPromises);
        const allFieldsValid = fieldResults.every(Boolean);

        set((draft) => {
          const draftForm = draft;
          if (draftForm) {
            draftForm.isValid = allFieldsValid;
          }
        });

        return allFieldsValid;
      },

      setSubmitting: (submitting) => {
        set((state) => {
          const form = state;
          if (!form) return;

          form.isSubmitting = submitting;
        });
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
          form.formErrors = null;
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
