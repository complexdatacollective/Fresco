import { enableMapSet } from 'immer';
import { immer } from 'zustand/middleware/immer';
import { createStore } from 'zustand/vanilla';
import { type FieldValue } from '~/lib/interviewer/utils/field-validation';
import type {
  FieldConfig,
  FieldState,
  FormConfig,
  FormErrors,
  ValidationContext,
} from '../types';
import { setValue } from '../utils/objectPath';
import { validateFieldValue } from '../utils/validation';

// Enable Map/Set support in Immer
enableMapSet();

export type FormStore = {
  fields: Map<string, FieldState>;
  isSubmitting: boolean;
  isValidating: boolean;
  isDirty: boolean;
  isValid: boolean;
  context: Record<string, unknown>;
  submitHandler:
    | ((data: Record<string, unknown>) => void | Promise<void>)
    | null;
  submitInvalidHandler: ((errors: FormErrors) => void) | null;

  // Form management
  registerForm: (config: FormConfig) => void;
  reset: () => void;

  // Field management
  registerField: (config: FieldConfig) => void;
  unregisterField: (fieldName: string) => void;

  // Field state updates
  setFieldValue: (fieldName: string, value: FieldValue) => void;
  setFieldError: (fieldName: string, error: string | null) => void;
  setFieldTouched: (fieldName: string, touched: boolean) => void;
  setFieldDirty: (fieldName: string, dirty: boolean) => void;
  setFieldValidating: (fieldName: string, validating: boolean) => void;

  // Getters with selective subscription
  getFieldState: (fieldName: string) => FieldState | undefined;
  getFormValues: () => Record<string, FieldValue>;
  getFormErrors: () => Record<string, string[]>;

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

export const createFormStore = () => {
  return createStore<FormStore>()(
    immer((set, get, store) => ({
      fields: new Map(),

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
        set(store.getInitialState());
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
            return;
          }

          state.fields.get(fieldName)!.value = value;

          state.fields.get(fieldName)!.meta.isDirty = true;
        });
      },

      setFieldError: (fieldName, error) => {
        set((state) => {
          if (!state.fields.get(fieldName)) return;

          state.fields.get(fieldName)!.meta.errors = error ? [error] : null;
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

      setFieldValidating: (fieldName, validating) => {
        set((state) => {
          if (!state.fields.get(fieldName)) return;

          state.fields.get(fieldName)!.meta.isValidating = validating;

          // Update form-level isValidating
          state.isValidating = Array.from(state.fields.values()).some(
            (field) => field.meta.isValidating,
          );
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
        const errors: FormErrors = {};
        Array.from(state.fields.entries()).forEach(
          ([fieldName, fieldState]) => {
            if (fieldState.meta.errors) {
              setValue(errors, fieldName, fieldState.meta.errors);
            }
          },
        );
        return errors;
      },

      validateField: async (fieldName) => {
        const state = get();
        const field = state.getFieldState(fieldName);

        if (!field) return;

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

          const { isValid, errors } = await validateFieldValue(
            field.value,
            field.validation,
            validationContext,
          );

          set((draft) => {
            const form = draft;
            if (form?.fields.get(fieldName)) {
              form.fields.get(fieldName)!.meta.isValidating = false;
              form.fields.get(fieldName)!.meta.isValid = isValid;
              form.fields.get(fieldName)!.meta.errors = errors;
              // Update form-level isValid
              form.isValid = Array.from(form.fields.values()).every(
                (field) => field.meta.isValid,
              );
            }
          });
        } catch (err) {
          set((draft) => {
            const form = draft;
            if (form?.fields.get(fieldName)) {
              form.fields.get(fieldName)!.meta.errors = [
                'Error with validation error',
              ];
              form.fields.get(fieldName)!.meta.isValid = false;
              form.fields.get(fieldName)!.meta.isValidating = false;
              // Update form-level isValid
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
            if (!fieldState) return true;

            const context = {
              ...state.context,
              formValues: state.getFormValues(),
            } as ValidationContext;

            const { isValid, errors } = await validateFieldValue(
              fieldState.value,
              fieldState.validation,
              context,
            );

            // Update field state with validation result
            if (!isValid && errors) {
              set((draft) => {
                const draftForm = draft;
                if (draftForm?.fields) {
                  draftForm.fields.get(fieldName)!.meta.errors = errors;
                  draftForm.fields.get(fieldName)!.meta.isValid = false;

                  // Set all fields as touched to trigger showing validation errors
                  draftForm.fields.get(fieldName)!.meta.isTouched = true;
                }
              });
            }

            return isValid;
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
          const validation =
            fieldConfig?.validation as FieldConfig['validation'];

          fields.set(fieldName, {
            value: initialValue,
            initialValue,
            validation,
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
