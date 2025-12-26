import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
} from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useFormStore } from '../store/formStoreProvider';
import type {
  ChangeHandler,
  FieldState,
  FieldValue,
  ValidationContext,
} from '../types';
import {
  makeValidationFunction,
  makeValidationHints,
  type ValidationPropsCatalogue,
} from '../validation/helpers';

/**
 * Helper function to determine if a field should show an error message.
 * Only shows errors after the field has been blurred and is dirty (value changed).
 */
function useFieldShouldShowError(
  fieldState: FieldState | undefined,
  fieldErrors: string[] | null,
) {
  if (!fieldState) {
    return false;
  }

  const { meta } = fieldState;

  // Only show errors after the field has been blurred and is dirty
  return Boolean(
    meta.isBlurred && meta.isDirty && fieldErrors && fieldErrors.length > 0,
  );
}

export type UseFieldResult = {
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
    'onChange': ChangeHandler<FieldValue>; // Handles both direct value changes and event-based changes
    'onBlur': (e: React.FocusEvent) => void;
    'aria-required': boolean; // Indicates if the field is required
    'aria-invalid': boolean; // Indicates if the field is invalid
    'aria-describedby': string; // IDs of elements that provide additional information about the field
    'aria-disabled': boolean; // Indicates if the field is disabled
    'aria-readonly': boolean; // Indicates if the field is read-only
  };
  validationSummary?: ReactNode;
};

export type UseFieldConfig = {
  name: string;
  initialValue?: FieldValue;
  showValidationHints?: boolean;
  /**
   * Context required for context-dependent validations like unique, sameAs, etc.
   */
  validationContext?: ValidationContext;
  disabled?: boolean;
  readOnly?: boolean;
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
  // We serialize the props to create a stable dependency
  const validationPropsJson = JSON.stringify(validationProps);

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

  const fieldErrors = useFormStore(
    useShallow((state) => state.getFieldErrors(name)),
  );
  const registerField = useFormStore((store) => store.registerField);
  const unregisterField = useFormStore((store) => store.unregisterField);
  const setFieldValue = useFormStore((store) => store.setFieldValue);
  const setFieldBlurred = useFormStore((store) => store.setFieldBlurred);
  const validateField = useFormStore((store) => store.validateField);

  const shouldShowError = useFieldShouldShowError(fieldState, fieldErrors);

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

  const handleChange: ChangeHandler = useCallback(
    (valueOrEvent) => {
      // Smart detection: if it's an event object, extract the value; otherwise use as-is
      let value: FieldValue;
      if (
        valueOrEvent &&
        typeof valueOrEvent === 'object' &&
        'target' in valueOrEvent &&
        valueOrEvent.target instanceof EventTarget
      ) {
        // It's an event object, extract the value
        value = valueOrEvent.target.value;
      } else {
        // It's a direct value
        value = valueOrEvent as FieldValue;
      }

      setFieldValue(config.name, value);

      // Validate on change only after the field has been blurred once
      // This provides real-time feedback on subsequent edits without
      // bombarding users with errors while typing their first characters
      if (fieldState?.meta.isBlurred) {
        void validateField(config.name);
      }
    },
    [config.name, setFieldValue, fieldState?.meta.isBlurred, validateField],
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
      // This enables subsequent change validation
      setFieldBlurred(config.name);

      // TODO: cache validation result if value hasn't changed.
      void validateField(config.name);
    },
    [config.name, setFieldBlurred, validateField],
  );

  // Only show invalid state after the field has been blurred and is dirty
  const showInvalid = Boolean(
    fieldState?.meta.isBlurred &&
      fieldState?.meta.isDirty &&
      !fieldState?.meta.isValid,
  );

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
      'value': fieldState?.value,
      'onChange': handleChange,
      'onBlur': handleBlur,
      'aria-required': !!validationProps.required,
      'aria-invalid': showInvalid,
      'aria-disabled': config.disabled ?? false,
      'aria-readonly': config.readOnly ?? false,
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
