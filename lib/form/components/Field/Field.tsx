'use client';

import { LayoutGroup } from 'motion/react';
import { type ReactNode } from 'react';
import { useField } from '~/lib/form/hooks/useField';
import {
  type CustomFieldValidation,
  type FieldValue,
  type FieldValueProps,
  type ValidationContext,
} from '~/lib/form/types';
import { type ValidationPropsCatalogue } from '../../validation/helpers';
import { BaseField } from './BaseField';

/**
 * Props that Field injects into field components.
 *
 * These props are marked optional because field components need to support
 * two usage patterns:
 *
 * 1. **Within Field** (primary pattern): Field always provides these props
 *    via useField hook. Components receive id, name, onBlur, aria-describedby,
 *    etc. automatically.
 *
 * 2. **Standalone** (secondary pattern): Components like InputField, SelectField,
 *    and ToggleField are sometimes used outside of Field for simple controlled
 *    inputs (e.g., in data tables, settings panels). In these cases, the
 *    consumer provides only value/onChange and optionally disabled/readOnly.
 *
 * Making these optional allows both patterns while maintaining type safety.
 * The Field component guarantees these are always provided in pattern 1.
 */
export type InjectedFieldProps = {
  'id'?: string;
  'name'?: string;
  'onBlur'?: (e: React.FocusEvent) => void;
  'aria-required'?: boolean;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
  'aria-disabled'?: boolean;
  'aria-readonly'?: boolean;
  'disabled'?: boolean;
  'readOnly'?: boolean;
};

// ═══════════════════════════════════════════════════════════════
// Type utilities for field component validation
// ═══════════════════════════════════════════════════════════════

/**
 * Extract value type from a component's props.
 * Uses direct property access instead of conditional type inference
 * to properly handle optional value properties.
 * Returns `never` if the component doesn't have a value prop.
 */
type ExtractValue<C extends ValidFieldComponent> =
  'value' extends keyof React.ComponentProps<C>
    ? Exclude<React.ComponentProps<C>['value'], undefined>
    : never;

/**
 * Constraint for valid field components.
 * Components must accept value and onChange props compatible with FieldValue.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ValidFieldComponent = React.ComponentType<any>;

// ═══════════════════════════════════════════════════════════════
// Value-based validation prop inference
// ═══════════════════════════════════════════════════════════════

/**
 * Common validation props available for all field value types.
 * These validations make sense regardless of the underlying data type.
 */
type CommonValidationProps = {
  required?: boolean;
  custom?: CustomFieldValidation | CustomFieldValidation[];
  unique?: string;
  sameAs?: string;
  differentFrom?: string;
  greaterThanVariable?: string;
  lessThanVariable?: string;
};

/**
 * Validation props specific to string values.
 */
type StringValidationProps = {
  minLength?: number;
  maxLength?: number;
  pattern?: { regex: string; hint: string; errorMessage: string };
};

/**
 * Validation props specific to number values.
 */
type NumberValidationProps = {
  minValue?: number;
  maxValue?: number;
};

/**
 * Validation props specific to array values.
 */
type ArrayValidationProps = {
  minSelected?: number;
  maxSelected?: number;
};

/**
 * Infers the appropriate validation props based on the field's value type.
 * - All fields get CommonValidationProps (required, custom, unique, sameAs, etc.)
 * - String fields additionally get minLength, maxLength, pattern
 * - Number fields additionally get minValue, maxValue
 * - Array fields additionally get minSelected, maxSelected
 */
type ValidationPropsForValue<V> = CommonValidationProps &
  (V extends string ? StringValidationProps : unknown) &
  (V extends number ? NumberValidationProps : unknown) &
  (V extends unknown[] ? ArrayValidationProps : unknown);

// ═══════════════════════════════════════════════════════════════
// Utility type for creating field component prop definitions
// ═══════════════════════════════════════════════════════════════

/**
 * Utility type for defining field component props.
 *
 * Combines:
 * - FieldValueProps<V> - value and onChange with the specified value type
 * - InjectedFieldProps - aria props, onBlur, disabled, readOnly
 * - Element props from TElement (minus conflicts)
 * - Custom props via TCustom
 *
 * Note: Validation props are NOT included here - they are handled by the
 * Field component and passed to useField. Field components don't receive
 * validation props directly.
 *
 * @example
 * ```typescript
 * type InputFieldProps = CreateFormFieldProps<
 *   string,
 *   'input',
 *   { size?: 'sm' | 'md' | 'lg'; prefixComponent?: ReactNode; }
 * >;
 * ```
 */
export type CreateFormFieldProps<
  V extends FieldValue,
  TElement extends keyof React.JSX.IntrinsicElements,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  TCustom = {},
> = FieldValueProps<V> &
  InjectedFieldProps &
  Omit<
    React.JSX.IntrinsicElements[TElement],
    keyof FieldValueProps<V> | keyof InjectedFieldProps | keyof TCustom
  > &
  TCustom;

/**
 * Props for the Field component itself.
 * Generic over C (the component type) to enable type inference.
 */
export type FieldOwnProps<C extends ValidFieldComponent> = {
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
};

/**
 * Full props for Field, combining Field's own props with the component's props.
 * Excludes value/onChange/InjectedFieldProps since Field provides these.
 * Also excludes validation prop keys to avoid conflicts with native HTML attributes
 * (e.g., HTML input's `pattern` attribute vs our validation `pattern` object).
 * Validation props are inferred based on the component's value type.
 */
export type FieldProps<C extends ValidFieldComponent> = FieldOwnProps<C> &
  Omit<
    React.ComponentProps<C>,
    | keyof InjectedFieldProps
    | keyof FieldValueProps<FieldValue>
    | keyof ValidationPropsCatalogue
  > &
  ValidationPropsForValue<ExtractValue<C>>;

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
  component: Component,
  disabled,
  readOnly,
  ...componentProps
}: FieldProps<C> & { component: C }) {
  const { id, containerProps, fieldProps, meta, validationSummary } = useField({
    name,
    initialValue: initialValue as FieldValue,
    showValidationHints,
    validationContext,
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
            {...(componentProps as any)}
          />
        }
      </BaseField>
    </LayoutGroup>
  );
}
