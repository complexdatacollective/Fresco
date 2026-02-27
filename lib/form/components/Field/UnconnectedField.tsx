'use client';

import { LayoutGroup } from 'motion/react';
import { type ReactNode, useId } from 'react';
import { type ValidationContext } from '../../store/types';
import { type ValidationPropKey } from '../../validation/functions';
import { BaseField } from './BaseField';
import {
  type ExtractValue,
  type ValidationPropsForValue,
  type ValidFieldComponent,
} from './types';

// Keys that UnconnectedField injects into the component —
// only these need to be omitted from the consumer-facing type.
type ManagedKeys = 'id' | 'aria-required' | 'aria-describedby';

/**
 * Props for the Field component itself.
 * Generic over C (the component type) to enable type inference.
 */
type FieldOwnProps<C extends ValidFieldComponent> = {
  name: string;
  label: string;
  hint?: ReactNode;
  initialValue?: ExtractValue<C> | undefined;
  showValidationHints?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /**
   * Context required for context-dependent validations like unique, sameAs, etc.
   */
  validationContext?: ValidationContext;
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
};

type UnconnectedFieldProps<C extends ValidFieldComponent> = FieldOwnProps<C> &
  Omit<React.ComponentProps<C>, ValidationPropKey | ManagedKeys> &
  ValidationPropsForValue<ExtractValue<C>> & {
    component: C;
    showErrors?: boolean;
  };

/**
 * UnconnectedField renders a field with consistent styling but without
 * connecting to form context. Use this for standalone fields or when
 * managing state externally.
 *
 * For fields that should connect to form context, use Field instead.
 *
 * @example
 * ```tsx
 * <UnconnectedField
 *   label="Username"
 *   component={Input}
 *   value={username}
 *   onChange={setUsername}
 * />
 * ```
 */
export default function UnconnectedField<C extends ValidFieldComponent>({
  id: providedId,
  label,
  hint,
  required,
  errors,
  showErrors,
  component: Component,
  ...componentProps
}: UnconnectedFieldProps<C>) {
  const generatedId = useId();
  const id = providedId ?? generatedId;

  const describedBy = [hint && `${id}-hint`, errors?.length && `${id}-error`]
    .filter(Boolean)
    .join(' ');

  return (
    <LayoutGroup id={id}>
      <BaseField
        id={id}
        label={label}
        hint={hint}
        required={Boolean(componentProps.required)}
        errors={errors}
        showErrors={showErrors}
      >
        <Component
          id={id}
          aria-required={required ?? false}
          aria-describedby={describedBy || undefined}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {...(componentProps as any)}
        />
      </BaseField>
    </LayoutGroup>
  );
}
