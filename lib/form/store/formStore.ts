import { enableMapSet } from 'immer';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  FieldConfig,
  FieldState,
  FormConfig,
  FormState,
  ValidationContext,
} from '../types';
import { setValue } from '../utils/objectPath';
import { validateFieldValue } from '../utils/validation';

// Enable Map/Set support in Immer
enableMapSet();

type FormStore = {
  forms: Map<string, FormState>;
  formConfigs: Map<string, FormConfig>;
  fieldConfigs: Map<string, Map<string, FieldConfig>>;

  // Form management
  registerForm: (name: string, config: FormConfig) => void;
  unregisterForm: (name: string) => void;

  // Field management
  registerField: (
    formName: string,
    fieldName: string,
    config: FieldConfig,
  ) => void;
  unregisterField: (formName: string, fieldName: string) => void;

  // Field state updates
  setValue: (formName: string, fieldName: string, value: unknown) => void;
  setError: (formName: string, fieldName: string, error: string | null) => void;
  setTouched: (formName: string, fieldName: string, touched: boolean) => void;
  setDirty: (formName: string, fieldName: string, dirty: boolean) => void;
  setValidating: (
    formName: string,
    fieldName: string,
    validating: boolean,
  ) => void;

  // Getters with selective subscription
  getFieldState: (
    formName: string,
    fieldName: string,
  ) => FieldState | undefined;
  getFormValues: (formName: string) => Record<string, unknown>;
  getFormErrors: (formName: string) => Record<string, string>;
  getFormState: (formName: string) => FormState | undefined;

  // Validation
  validateField: (
    formName: string,
    fieldName: string,
    context: ValidationContext,
  ) => Promise<void>;
  validateForm: (formName: string) => Promise<boolean>;

  // Form submission
  setSubmitting: (formName: string, submitting: boolean) => void;
  incrementSubmitCount: (formName: string) => void;

  // Form reset
  resetForm: (formName: string) => void;
  resetField: (formName: string, fieldName: string) => void;
};

export const useFormStore = create<FormStore>()(
  immer((set, get) => ({
    forms: new Map(),
    formConfigs: new Map(),
    fieldConfigs: new Map(),

    registerForm: (name, config) => {
      set((state) => {
        const existingForm = state.forms.get(name);
        const existingFieldConfigs = state.fieldConfigs.get(name);

        // If form already exists (auto-created by field registration), preserve the fields
        if (existingForm) {
          // Keep existing fields but update other form state
          state.forms.set(name, {
            ...existingForm,
            isSubmitting: false,
            isValidating: false,
            submitCount: 0,
            isValid: true,
          });
        } else {
          // Create new form
          state.forms.set(name, {
            fields: {},
            isSubmitting: false,
            isValidating: false,
            submitCount: 0,
            isValid: true,
          });
        }

        state.formConfigs.set(name, config);

        // Preserve existing field configs if they exist
        if (!existingFieldConfigs) {
          state.fieldConfigs.set(name, new Map());
        }
      });
    },

    unregisterForm: (name) => {
      set((state) => {
        state.forms.delete(name);
        state.formConfigs.delete(name);
        state.fieldConfigs.delete(name);
      });
    },

    registerField: (formName, fieldName, config) => {
      set((state) => {
        const form = state.forms.get(formName);

        // Form must exist before fields can register
        if (!form) {
          return;
        }

        const fieldState: FieldState = {
          value: config.initialValue ?? '',
          meta: {
            error: null,
            isValidating: false,
            isTouched: false,
            isDirty: false,
            isValid: false,
          },
        };

        // Store field state with dot notation key (flat structure)
        form.fields[fieldName] = fieldState;

        // Store field config
        const formFieldConfigs = state.fieldConfigs.get(formName);
        if (formFieldConfigs) {
          formFieldConfigs.set(fieldName, config);
        }
      });
    },

    unregisterField: (formName, fieldName) => {
      set((state) => {
        const form = state.forms.get(formName);
        if (!form) return;

        // Remove field from form state
        delete form.fields[fieldName];

        // Remove field config
        const formFieldConfigs = state.fieldConfigs.get(formName);
        if (formFieldConfigs) {
          formFieldConfigs.delete(fieldName);
        }
      });
    },

    setValue: (formName, fieldName, value) => {
      set((state) => {
        const form = state.forms.get(formName);
        if (!form?.fields[fieldName]) {
          return;
        }

        form.fields[fieldName].value = value;
        form.fields[fieldName].meta.isDirty = true;
      });
    },

    setError: (formName, fieldName, error) => {
      set((state) => {
        const form = state.forms.get(formName);
        if (!form?.fields[fieldName]) return;

        form.fields[fieldName].meta.error = error;
        form.fields[fieldName].meta.isValid = !error;

        // Update form-level isValid
        form.isValid = Object.values(form.fields).every(
          (field) => field.meta.isValid,
        );
      });
    },

    setTouched: (formName, fieldName, touched) => {
      set((state) => {
        const form = state.forms.get(formName);
        if (!form?.fields[fieldName]) return;

        form.fields[fieldName].meta.isTouched = touched;
      });
    },

    setDirty: (formName, fieldName, dirty) => {
      set((state) => {
        const form = state.forms.get(formName);
        if (!form?.fields[fieldName]) return;

        form.fields[fieldName].meta.isDirty = dirty;
      });
    },

    setValidating: (formName, fieldName, validating) => {
      set((state) => {
        const form = state.forms.get(formName);
        if (!form?.fields[fieldName]) return;

        form.fields[fieldName].meta.isValidating = validating;

        // Update form-level isValidating
        form.isValidating = Object.values(form.fields).some(
          (field) => field.meta.isValidating,
        );
      });
    },

    getFieldState: (formName, fieldName) => {
      const form = get().forms.get(formName);
      return form?.fields[fieldName];
    },

    getFormValues: (formName) => {
      const form = get().forms.get(formName);
      if (!form) return {};

      const values: Record<string, unknown> = {};
      Object.entries(form.fields).forEach(([fieldName, fieldState]) => {
        setValue(values, fieldName, fieldState.value);
      });
      return values;
    },

    getFormErrors: (formName) => {
      const form = get().forms.get(formName);
      if (!form) return {};
      const errors: Record<string, string> = {};
      Object.entries(form.fields).forEach(([fieldName, fieldState]) => {
        if (fieldState.meta.error) {
          setValue(errors, fieldName, fieldState.meta.error);
        }
      });
      return errors;
    },

    getFormState: (formName) => {
      return get().forms.get(formName);
    },

    validateField: async (formName, fieldName, context) => {
      const state = get();
      const formFieldConfigs = state.fieldConfigs.get(formName);
      const fieldConfig = formFieldConfigs?.get(fieldName);
      const fieldState = state.getFieldState(formName, fieldName);

      if (!fieldConfig || !fieldState) return;

      set((draft) => {
        const form = draft.forms.get(formName);
        if (form?.fields[fieldName]) {
          form.fields[fieldName].meta.isValidating = true;
        }
      });

      try {
        const { isValid, error } = await validateFieldValue(
          fieldState.value,
          fieldConfig.validation,
          context,
        );

        set((draft) => {
          const form = draft.forms.get(formName);
          if (form?.fields[fieldName]) {
            form.fields[fieldName].meta.error = error;
            form.fields[fieldName].meta.isValid = isValid;
            form.fields[fieldName].meta.isValidating = false;

            // Update form-level isValid
            form.isValid = Object.values(form.fields).every(
              (field) => field.meta.isValid,
            );
          }
        });
      } catch (err) {
        set((draft) => {
          const form = draft.forms.get(formName);
          if (form?.fields[fieldName]) {
            form.fields[fieldName].meta.error = 'Validation error';
            form.fields[fieldName].meta.isValid = false;
            form.fields[fieldName].meta.isValidating = false;

            // Update form-level isValid
            form.isValid = Object.values(form.fields).every(
              (field) => field.meta.isValid,
            );
          }
        });
      }
    },

    validateForm: async (formName) => {
      const state = get();
      const form = state.forms.get(formName);
      const formFieldConfigs = state.fieldConfigs.get(formName);
      const formConfig = state.formConfigs.get(formName);

      if (!form || !formFieldConfigs) return false;

      // First validate all fields
      const fieldValidationPromises = Array.from(
        formFieldConfigs.entries(),
      ).map(async ([fieldName, fieldConfig]) => {
        const fieldState = form.fields[fieldName];
        if (!fieldState) return true;

        const context = {
          additionalContext: formConfig?.additionalContext,
          formValues: state.getFormValues(formName),
        };

        const { isValid, error } = await validateFieldValue(
          fieldState.value,
          fieldConfig.validation,
          context,
        );

        // Update field state with validation result
        if (!isValid && error) {
          set((draft) => {
            const draftForm = draft.forms.get(formName);
            if (draftForm?.fields[fieldName]) {
              draftForm.fields[fieldName].meta.error = error;
              draftForm.fields[fieldName].meta.isValid = false;
            }
          });
        }

        return isValid;
      });

      const fieldResults = await Promise.all(fieldValidationPromises);
      const allFieldsValid = fieldResults.every(Boolean);

      // Then run form-level validation if all fields are valid
      if (allFieldsValid && formConfig?.validation) {
        try {
          const formValues = state.getFormValues(formName);
          const formErrors = await formConfig.validation(formValues);

          if (formErrors && Object.keys(formErrors).length > 0) {
            // Apply form-level errors to fields
            set((draft) => {
              const draftForm = draft.forms.get(formName);
              if (draftForm) {
                Object.entries(formErrors).forEach(([fieldName, error]) => {
                  if (draftForm.fields[fieldName] && error) {
                    draftForm.fields[fieldName].meta.error = error;
                    draftForm.fields[fieldName].meta.isValid = false;
                  }
                });

                // Update form-level isValid
                draftForm.isValid = Object.values(draftForm.fields).every(
                  (field) => field.meta.isValid,
                );
              }
            });

            return false;
          }
        } catch (error) {
          return false;
        }
      }

      // Update form-level isValid
      set((draft) => {
        const draftForm = draft.forms.get(formName);
        if (draftForm) {
          draftForm.isValid = Object.values(draftForm.fields).every(
            (field) => field.meta.isValid,
          );
        }
      });

      return allFieldsValid;
    },

    setSubmitting: (formName, submitting) => {
      set((state) => {
        const form = state.forms.get(formName);
        if (!form) return;

        form.isSubmitting = submitting;
      });
    },

    incrementSubmitCount: (formName) => {
      set((state) => {
        const form = state.forms.get(formName);
        if (!form) return;

        form.submitCount += 1;
      });
    },

    resetForm: (formName) => {
      set((state) => {
        const form = state.forms.get(formName);
        const formFieldConfigs = state.fieldConfigs.get(formName);

        if (!form || !formFieldConfigs) return;

        // Reset all fields to their initial values
        Object.keys(form.fields).forEach((fieldName) => {
          const fieldConfig = formFieldConfigs.get(fieldName);
          const initialValue = fieldConfig?.initialValue ?? '';

          form.fields[fieldName] = {
            value: initialValue,
            meta: {
              error: null,
              isValidating: false,
              isTouched: false,
              isDirty: false,
              isValid: true,
            },
          };
        });

        // Reset form-level state
        form.isSubmitting = false;
        form.isValidating = false;
        form.submitCount = 0;
        form.isValid = true;
      });
    },

    resetField: (formName, fieldName) => {
      set((state) => {
        const form = state.forms.get(formName);
        const formFieldConfigs = state.fieldConfigs.get(formName);

        if (!form?.fields[fieldName] || !formFieldConfigs) return;

        const fieldConfig = formFieldConfigs.get(fieldName);
        const initialValue = fieldConfig?.initialValue ?? '';

        form.fields[fieldName] = {
          value: initialValue,
          meta: {
            error: null,
            isValidating: false,
            isTouched: false,
            isDirty: false,
            isValid: true,
          },
        };

        // Update form-level isValid
        form.isValid = Object.values(form.fields).every(
          (field) => field.meta.isValid,
        );
      });
    },
  })),
);
