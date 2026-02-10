import { debounce } from 'es-toolkit';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
} from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  type FieldValue,
  type ValidationPropsCatalogue,
} from '../components/Field/types';
import type { FieldState, ValidationContext } from '../store/types';
import {
  makeValidationFunction,
  makeValidationHints,
} from '../validation/helpers';
import { validationPropKeys } from '../validation/functions';
import useFormStore from './useFormStore';

/**
 * Helper function to determine if a field should show an error message.
 *
 * For fields with validateOnChange: shows errors as soon as the field is dirty
 * and validation completes (no need to blur first).
 *
 * For fields without validateOnChange: shows errors after the field has been
 * blurred, is dirty, and validation has completed.
 */
function shouldShowFieldError(
  fieldState: FieldState | undefined,
  fieldErrors: string[] | null,
  validateOnChange: boolean,
) {
  if (!fieldState) {
    return false;
  }

  const { meta } = fieldState;

  // Don't show errors while async validation is in progress
  if (meta.isValidating) {
    return false;
  }

  // Must have errors and be dirty
  if (!fieldErrors || fieldErrors.length === 0 || !meta.isDirty) {
    return false;
  }

  // With validateOnChange, show errors immediately after validation completes
  // Without it, wait until field has been blurred
  return validateOnChange || meta.isBlurred;
}

type UseFieldResult = {
  id: string;
  meta: {
    shouldShowError: boolean;
    errors: string[] | undefined;
    isValidating: boolean;
    isTouched: boolean;
    isBlurred: boolean;
    isDirty: boolean;
    isValid: boolean;
  };
  containerProps: {
    'data-field-name': string; // Used for scrolling to field errors
  };
  fieldProps: {
    'value': FieldValue;
    'onChange': (value: FieldValue) => void;
    'onBlur': (e: React.FocusEvent) => void;
    'disabled': boolean;
    'readOnly': boolean;
    'aria-required': boolean; // Indicates if the field is required
    'aria-invalid': boolean; // Indicates if the field is invalid
    'aria-describedby': string; // IDs of elements that provide additional information about the field
    'aria-disabled': boolean; // Indicates if the field is disabled
    'aria-readonly': boolean; // Indicates if the field is read-only
  };
  validationSummary?: ReactNode;
};

/** Default debounce delay for validateOnChange in milliseconds */
const DEFAULT_VALIDATE_ON_CHANGE_DELAY = 1000;

type UseFieldConfig = {
  name: string;
  initialValue?: FieldValue;
  showValidationHints?: boolean;
  /**
   * Context required for context-dependent validations like unique, sameAs, etc.
   */
  validationContext?: ValidationContext;
  disabled?: boolean;
  readOnly?: boolean;
  /**
   * When true, validates the field on change instead of waiting for blur.
   * Validation is debounced to avoid excessive calls while typing.
   * Useful for async validation where immediate feedback is desired.
   */
  validateOnChange?: boolean;
  /**
   * Debounce delay in milliseconds for validateOnChange.
   * Only applies when validateOnChange is true.
   * @default 300
   */
  validateOnChangeDelay?: number;
} & Partial<ValidationPropsCatalogue>;

export function useField(config: UseFieldConfig): UseFieldResult {
  const {
    name,
    initialValue,
    showValidationHints = false,
    validationContext,
    ...validationProps
  } = config;

  const id = useId();
  const isUnmountingRef = useRef(false);

  // Memoize the validation function based on validation props
  // We serialize only the actual validation props (not component props like prefixComponent)
  // to create a stable dependency and avoid circular reference errors from React elements
  const validationOnlyProps: Record<string, unknown> = {};
  for (const key of validationPropKeys) {
    if (key in validationProps) {
      validationOnlyProps[key] =
        validationProps[key as keyof typeof validationProps];
    }
  }
  const validationPropsJson = JSON.stringify(validationOnlyProps);

  // Include validationContext in the props passed to makeValidationFunction
  const propsWithContext = { ...validationProps, validationContext };

  const validation = useMemo(
    () => makeValidationFunction(propsWithContext),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [validationPropsJson, validationContext],
  );

  // Memoize the validation summary (only compute if showValidationHints is true)
  const validationSummary = useMemo(
    () =>
      showValidationHints ? makeValidationHints(propsWithContext) : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showValidationHints, validationPropsJson, validationContext],
  );

  const fieldState = useFormStore((state) => state.getFieldState(name));
  const isSubmitting = useFormStore((state) => state.isSubmitting);

  const fieldErrors = useFormStore(
    useShallow((state) => state.getFieldErrors(name)),
  );
  const registerField = useFormStore((store) => store.registerField);
  const unregisterField = useFormStore((store) => store.unregisterField);
  const setFieldValue = useFormStore((store) => store.setFieldValue);
  const setFieldBlurred = useFormStore((store) => store.setFieldBlurred);
  const validateField = useFormStore((store) => store.validateField);

  // Disable fields while form is submitting
  const isDisabled = isSubmitting || config.disabled;
  const isReadOnly = config.readOnly;

  const validateOnChange = config.validateOnChange ?? false;
  const validateOnChangeDelay =
    config.validateOnChangeDelay ?? DEFAULT_VALIDATE_ON_CHANGE_DELAY;

  const shouldShowError = shouldShowFieldError(
    fieldState,
    fieldErrors,
    validateOnChange,
  );

  // Create a debounced validation function for validateOnChange
  // This prevents excessive validation calls while the user is typing
  const debouncedValidate = useMemo(() => {
    const validate = (fieldName: string) => {
      void validateField(fieldName);
    };
    return debounce(validate, validateOnChangeDelay);
  }, [validateField, validateOnChangeDelay]);

  // Cancel debounced validation on unmount
  useEffect(() => {
    return () => {
      debouncedValidate.cancel();
    };
  }, [debouncedValidate]);

  // Register field on mount
  useEffect(() => {
    isUnmountingRef.current = false;
    registerField({
      name,
      initialValue,
      validation,
    });

    return () => {
      isUnmountingRef.current = true;
      unregisterField(name);
    };
  }, [name, initialValue, validation, unregisterField, registerField]);

  const handleChange = useCallback(
    (value: FieldValue) => {
      setFieldValue(config.name, value);

      // If validateOnChange is enabled, use debounced validation
      // Otherwise, only validate after the field has been blurred once
      if (config.validateOnChange) {
        debouncedValidate(config.name);
      } else if (fieldState?.meta.isBlurred) {
        // After first blur, validate immediately on change (no debounce)
        void validateField(config.name);
      }
    },
    [
      config.name,
      config.validateOnChange,
      setFieldValue,
      fieldState?.meta.isBlurred,
      validateField,
      debouncedValidate,
    ],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      // Skip validation if clicking on a dialog close element
      const relatedTarget = e.relatedTarget;
      if (relatedTarget?.hasAttribute('data-dialog-close')) {
        return;
      }

      // Skip validation if this field is inside a dialog that's closing
      const target = e.target as HTMLElement;
      const parentDialog = target.closest('dialog');
      if (parentDialog && !parentDialog.open) {
        return;
      }

      // Mark the field as having been blurred at least once
      setFieldBlurred(config.name);

      // For validateOnChange fields, don't validate on blur - the debounced
      // change validation handles it. For other fields, validate on blur.
      if (!config.validateOnChange) {
        void validateField(config.name);
      }
    },
    [config.name, config.validateOnChange, setFieldBlurred, validateField],
  );

  // Show invalid styling when showing error text - keep them in sync
  const showInvalid = shouldShowError;

  const result: UseFieldResult = {
    id,
    meta: {
      shouldShowError,
      errors: fieldErrors ?? undefined,
      isValid: fieldState?.meta.isValid ?? false,
      isTouched: fieldState?.meta.isTouched ?? false,
      isBlurred: fieldState?.meta.isBlurred ?? false,
      isDirty: fieldState?.meta.isDirty ?? false,
      isValidating: fieldState?.meta.isValidating ?? false,
    },
    containerProps: {
      'data-field-name': name, // Used for scrolling to field errors
    },
    fieldProps: {
      // Use initialValue as fallback before field is registered in the store
      'value': fieldState?.value ?? initialValue,
      'onChange': handleChange,
      'onBlur': handleBlur,
      'disabled': isDisabled ?? false,
      'readOnly': isReadOnly ?? false,
      'aria-required': !!validationProps.required,
      'aria-invalid': showInvalid,
      'aria-disabled': isDisabled ?? false,
      'aria-readonly': isReadOnly ?? false,
      /**
       * Set this so that screen readers can properly announce the hint and error messages.
       * If either the hint or error ID is not present, it will be ignored by the screen reader.
       * The alternative would require us to check if the hint prop exists and if the error state
       * is set, which doesn't seem worth it.
       *
       * Note: we cannot use aria-description yet, as it is not widely supported.
       */
      'aria-describedby': `${id}-hint ${id}-error`.trim(),
    },
    validationSummary,
  };

  return result;
}
