import { enableMapSet } from 'immer';
import { z } from 'zod/mini';
import { immer } from 'zustand/middleware/immer';
import { createStore } from 'zustand/vanilla';
import { type FieldValue } from '../components/Field/types';
import { setValue } from '../utils/objectPath';
import { validateFieldValue } from '../validation/helpers';
import type {
  FieldConfig,
  FieldState,
  FlattenedErrors,
  FormConfig,
  FormSubmitHandler,
} from './types';

// Enable Map/Set support in Immer
enableMapSet();

const BATCH_FLUSH_MS = 30;

type LogEntry = {
  action: string;
  args: unknown[];
};

let storeInstanceCount = 0;

function createFormLogger(enabled: boolean) {
  if (!enabled) {
    return { log: undefined };
  }

  const id = ++storeInstanceCount;
  const prefix = `[FormStore #${String(id)}]`;

  const styles = {
    label: 'color: #8b5cf6; font-weight: bold',
    action: 'color: #06b6d4; font-weight: bold',
  };

  const batchableActions = new Set(['registerField', 'unregisterField']);
  let batch: LogEntry[] = [];
  let batchAction = '';
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  const flushBatch = () => {
    flushTimer = null;
    if (batch.length === 0) return;

    const entries = batch;
    const action = batchAction;
    batch = [];
    batchAction = '';

    if (entries.length === 1) {
      const entry = entries[0]!;
      // eslint-disable-next-line no-console
      console.log(
        `%c${prefix} %c${entry.action}`,
        styles.label,
        styles.action,
        ...entry.args,
      );
      return;
    }

    // eslint-disable-next-line no-console
    console.groupCollapsed(
      `%c${prefix} %c${action} %c(${String(entries.length)} fields)`,
      styles.label,
      styles.action,
      'color: #6b7280',
    );
    for (const entry of entries) {
      // eslint-disable-next-line no-console
      console.log(
        `%c${String(entry.args[0])}`,
        'color: #f59e0b',
        ...entry.args.slice(1),
      );
    }
    // eslint-disable-next-line no-console
    console.groupEnd();
  };

  const log = (action: string, ...args: unknown[]) => {
    if (batchableActions.has(action)) {
      if (batchAction && batchAction !== action) {
        flushBatch();
      }
      batchAction = action;
      batch.push({ action, args });

      if (flushTimer) clearTimeout(flushTimer);
      flushTimer = setTimeout(flushBatch, BATCH_FLUSH_MS);
      return;
    }

    // Non-batchable actions flush any pending batch then log immediately
    if (batch.length > 0) flushBatch();

    // eslint-disable-next-line no-console
    console.log(
      `%c${prefix} %c${action}`,
      styles.label,
      styles.action,
      ...args,
    );
  };

  return { log };
}

/**
 * Helper to calculate form validity based on both field states and form-level errors.
 * A form is valid only if all fields are valid AND there are no form-level errors.
 */
const calculateFormValidity = (
  fields: Map<string, FieldState>,
  formErrors: string[],
): boolean => {
  const allFieldsValid = Array.from(fields.values()).every(
    (field) => field.meta.isValid,
  );
  return allFieldsValid && formErrors.length === 0;
};

export type FormStore = {
  fields: Map<string, FieldState>;
  dormantValues: Map<string, FieldValue>;
  errors: FlattenedErrors;
  isSubmitting: boolean;
  isValidating: boolean;
  isDirty: boolean;
  isValid: boolean;
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
  setFieldBlurred: (fieldName: string) => void;

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

export type FormStoreOptions = {
  debug?: boolean;
  persistFieldValues?: boolean;
};

export const createFormStore = (options?: FormStoreOptions) => {
  const logger = createFormLogger(options?.debug ?? false);
  const persistFieldValues = options?.persistFieldValues ?? false;

  return createStore<FormStore>()(
    immer((set, get, _store) => ({
      fields: new Map(),
      dormantValues: new Map(),
      errors: { formErrors: [], fieldErrors: {} },

      isSubmitting: false,
      isValidating: false,
      isDirty: false,
      isValid: true,

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
          state.dormantValues.clear();
          state.errors = { formErrors: [], fieldErrors: {} };
          state.isSubmitting = false;
          state.isValidating = false;
          state.isDirty = false;
          state.isValid = true;
          state.submitHandler = null;
          state.submitInvalidHandler = null;
        });
      },

      registerField: (config) => {
        logger.log?.('registerField', config.name, {
          initialValue: config.initialValue,
          hasValidation: !!config.validation,
        });

        set((state) => {
          const dormantValue = state.dormantValues.get(config.name);
          const hasDormantValue = dormantValue !== undefined;
          const value = hasDormantValue ? dormantValue : config.initialValue;

          if (hasDormantValue) {
            state.dormantValues.delete(config.name);
          }

          const fieldState: FieldState = {
            initialValue: config.initialValue,
            validation: config.validation,
            value,
            meta: {
              isValidating: false,
              isTouched: hasDormantValue,
              isBlurred: false,
              isDirty: hasDormantValue,
              isValid: !config.validation,
            },
          };

          state.fields.set(config.name, fieldState);

          state.isValid = calculateFormValidity(
            state.fields,
            state.errors.formErrors,
          );
        });
      },

      unregisterField: (fieldName) => {
        logger.log?.('unregisterField', fieldName);

        // Check if field exists before updating to avoid unnecessary renders
        const currentState = get();
        if (currentState.fields.has(fieldName)) {
          set((state) => {
            if (persistFieldValues) {
              const field = state.fields.get(fieldName);
              if (field) {
                state.dormantValues.set(fieldName, field.value);
              }
            }

            state.fields.delete(fieldName);

            // Clean up any errors for this field
            if (state.errors.fieldErrors[fieldName]) {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { [fieldName]: _removed, ...remainingFieldErrors } =
                state.errors.fieldErrors;
              state.errors = {
                formErrors: state.errors.formErrors,
                fieldErrors: remainingFieldErrors,
              };
            }

            // Recalculate form validity
            state.isValid = calculateFormValidity(
              state.fields,
              state.errors.formErrors,
            );
          });
        }
      },

      setErrors: (errors) => {
        if (errors === null) {
          set((state) => {
            state.errors = { formErrors: [], fieldErrors: {} };
          });
          return;
        }

        set((state) => {
          state.errors = errors;
        });
      },

      setFieldValue: (fieldName, value) => {
        logger.log?.('setFieldValue', fieldName, value);

        set((state) => {
          if (!state.fields.get(fieldName)) {
            // eslint-disable-next-line no-console
            console.warn(`Field "${fieldName}" is not registered.`);
            return;
          }

          state.fields.get(fieldName)!.value = value;
          state.fields.get(fieldName)!.meta.isDirty = true;
          state.fields.get(fieldName)!.meta.isTouched = true;
          state.isDirty = true;
        });
      },

      setFieldTouched: (fieldName, touched) => {
        set((state) => {
          if (!state.fields.get(fieldName)) return;

          state.fields.get(fieldName)!.meta.isTouched = touched;
        });
      },

      setFieldBlurred: (fieldName) => {
        set((state) => {
          if (!state.fields.get(fieldName)) return;

          state.fields.get(fieldName)!.meta.isBlurred = true;
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
        // Return null if no errors or empty array (consistent API)
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
            form.fields.get(fieldName)!.meta.isValidating = true;
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
                field.meta.isValidating = false;
                field.meta.isValid = false;

                const prevFormErrors = form.errors ?? {
                  formErrors: [],
                  fieldErrors: {},
                };

                form.errors = {
                  formErrors: prevFormErrors.formErrors,
                  fieldErrors: {
                    ...prevFormErrors.fieldErrors,
                    [fieldName]: result.error.issues.map(
                      (issue) => issue.message,
                    ),
                  },
                };

                // Update form-level isValid (considers both field and form-level errors)
                form.isValid = calculateFormValidity(
                  form.fields,
                  form.errors.formErrors,
                );
              }
            });
          } else {
            set((draft) => {
              const form = draft;
              if (form?.fields.get(fieldName)) {
                form.fields.get(fieldName)!.meta.isValidating = false;
                form.fields.get(fieldName)!.meta.isValid = true;

                // Remove errors for this field when validation succeeds
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { [fieldName]: _removed, ...remainingFieldErrors } =
                  form.errors.fieldErrors;
                form.errors = {
                  formErrors: form.errors.formErrors,
                  fieldErrors: remainingFieldErrors,
                };

                // Update form-level isValid (considers both field and form-level errors)
                form.isValid = calculateFormValidity(
                  form.fields,
                  form.errors.formErrors,
                );
              }
            });
          }
        } catch (err) {
          set((draft) => {
            const form = draft;
            if (form?.fields.get(fieldName)) {
              form.fields.get(fieldName)!.meta.isValid = false;
              form.fields.get(fieldName)!.meta.isValidating = false;

              // Add error to the unified error store
              form.errors = {
                formErrors: form.errors.formErrors,
                fieldErrors: {
                  ...form.errors.fieldErrors,
                  [fieldName]: ['Something went wrong during validation'],
                },
              };

              // Update form-level isValid (considers both field and form-level errors)
              form.isValid = calculateFormValidity(
                form.fields,
                form.errors.formErrors,
              );
            }
          });
        }
      },

      validateForm: async () => {
        const state = get();
        const fields = state.fields;
        const fieldErrors: Record<string, string[]> = {};

        // Collect field meta updates to apply in a single batch
        const fieldMetaUpdates = new Map<
          string,
          { isValid: boolean; markAsTouched?: boolean }
        >();

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

        // Process validation results and collect errors and meta updates
        fieldResults.forEach(({ fieldName, result }) => {
          if (result && !result.success) {
            // Field has validation errors - flatten and collect
            const flattened = z.flattenError(result.error) as FlattenedErrors;

            // Errors can be in formErrors (no path) or fieldErrors (with nested paths)
            // Combine them for this field
            const combinedErrors = [
              ...flattened.formErrors,
              ...(flattened.fieldErrors[fieldName] ?? []),
            ] as string[];

            if (combinedErrors.length > 0) {
              fieldErrors[fieldName] = combinedErrors;
            }

            // Mark for update: touched, blurred, dirty, and invalid
            fieldMetaUpdates.set(fieldName, {
              isValid: false,
              markAsTouched: true,
            });
          } else if (result?.success) {
            // Field is valid
            fieldMetaUpdates.set(fieldName, { isValid: true });
          }
        });

        // Apply all updates in a single batch
        set((draft) => {
          // Apply field meta updates
          fieldMetaUpdates.forEach(({ isValid, markAsTouched }, fieldName) => {
            const field = draft.fields.get(fieldName);
            if (field) {
              field.meta.isValid = isValid;
              if (markAsTouched) {
                field.meta.isTouched = true;
                field.meta.isBlurred = true;
                field.meta.isDirty = true;
              }
            }
          });

          // Update the unified error store, preserving any existing form-level errors
          const existingFormErrors = draft.errors.formErrors;

          if (Object.keys(fieldErrors).length > 0) {
            draft.errors = {
              formErrors: existingFormErrors,
              fieldErrors,
            };
            draft.isValid = false;
          } else {
            draft.errors = {
              formErrors: existingFormErrors,
              fieldErrors: {},
            };
            // Only mark as valid if there are no form-level errors either
            draft.isValid = existingFormErrors.length === 0;
          }
        });

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
        logger.log?.('submitForm', {
          values: get().getFormValues(),
          isValid: get().isValid,
        });

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
          // Reset all fields to their initial values (inline to avoid nested set calls)
          state.fields.forEach((fieldState, fieldName) => {
            state.fields.set(fieldName, {
              ...fieldState,
              value: fieldState.initialValue,
              meta: {
                isValidating: false,
                isTouched: false,
                isBlurred: false,
                isDirty: false,
                // Fields without validation are valid by default
                isValid: !fieldState.validation,
              },
            });
          });

          // Reset form-level state
          state.errors = { formErrors: [], fieldErrors: {} };
          state.isSubmitting = false;
          state.isValidating = false;
          state.isDirty = false;
          state.isValid = calculateFormValidity(state.fields, []);
        });
      },

      resetField: (fieldName) => {
        set((state) => {
          const fieldConfig = state.fields.get(fieldName);
          if (!fieldConfig) return;

          const initialValue = fieldConfig.initialValue;

          state.fields.set(fieldName, {
            ...fieldConfig,
            value: initialValue,
            meta: {
              isValidating: false,
              isTouched: false,
              isBlurred: false,
              isDirty: false,
              // Fields without validation are valid by default
              isValid: !fieldConfig.validation,
            },
          });

          // Remove errors for this field from the unified error store
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [fieldName]: _removed, ...remainingFieldErrors } =
            state.errors.fieldErrors;

          state.errors = {
            formErrors: state.errors.formErrors,
            fieldErrors: remainingFieldErrors,
          };

          // Update form-level isValid (considers both field and form-level errors)
          state.isValid = calculateFormValidity(
            state.fields,
            state.errors.formErrors,
          );
        });
      },
    })),
  );
};
