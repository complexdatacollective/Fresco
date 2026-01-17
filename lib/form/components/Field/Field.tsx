'use client';

import { LayoutGroup } from 'motion/react';
import { useField } from '~/lib/form/hooks/useField';
import { type FieldValue } from '~/lib/form/store/types';
import { filterValidationProps } from '../../validation/helpers';
import { BaseField } from './BaseField';
import { type FieldProps, type ValidFieldComponent } from './types';

/**
 * Field component that connects to form context via useField hook.
 * Provides automatic state management, validation, and error display.
 *
 * The component prop must implement FieldValueProps<V> where V extends FieldValue.
 * This ensures type-safe value handling throughout the form system.
 *
 * For fields outside of form context, use UnconnectedField instead.
 */
export default function Field<C extends ValidFieldComponent>({
  name,
  label,
  hint,
  initialValue,
  showValidationHints = false,
  validationContext,
  validateOnChange,
  validateOnChangeDelay,
  component: Component,
  disabled,
  readOnly,
  ...componentProps
}: FieldProps<C>) {
  const { id, containerProps, fieldProps, meta, validationSummary } = useField({
    name,
    initialValue: initialValue as FieldValue,
    showValidationHints,
    validationContext,
    validateOnChange,
    validateOnChangeDelay,
    disabled,
    readOnly,
    // Pass validation props
    ...componentProps,
  });

  return (
    <LayoutGroup id={id}>
      <BaseField
        id={id}
        label={label}
        hint={hint}
        validationSummary={validationSummary}
        required={Boolean(componentProps.required)}
        errors={meta.errors}
        showErrors={meta.shouldShowError}
        containerProps={containerProps}
      >
        {
          <Component
            id={id}
            name={name}
            {...fieldProps}
            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
            {...(filterValidationProps(componentProps) as any)}
          />
        }
      </BaseField>
    </LayoutGroup>
  );
}
