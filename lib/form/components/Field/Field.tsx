'use client';

import { LayoutGroup } from 'motion/react';
import { type ReactNode } from 'react';
import { useField, type UseFieldResult } from '../../hooks/useField';
import { type ValidationContext } from '../../types';
import {
  filterValidationProps,
  type ValidationProps,
} from '../../validation/helpers';
import { BaseField } from './BaseField';

/**
 * Props that Field provides to components.
 * Excludes value, onChange, onBlur as these are defined by each component
 * with their specific types. Field provides these via fieldProps spread.
 */
type FieldComponentProps = Omit<
  Partial<UseFieldResult['fieldProps']>,
  'value' | 'onChange' | 'onBlur'
> & {
  id?: string;
  name?: string;
  disabled?: boolean;
  readOnly?: boolean;
};

/**
 * Create props for an input-like field component by omitting props that are
 * always provided by Field.
 */
export type CreateFieldProps<T = unknown> = T extends object
  ? FieldComponentProps &
      Omit<
        T,
        | 'value'
        | 'onChange'
        | 'disabled'
        | 'readOnly'
        | 'size'
        | keyof ValidationProps
      > &
      Partial<ValidationProps>
  : FieldComponentProps & Partial<ValidationProps>;

/**
 * Extract the value type from a component's props.
 * Works with both function components and generic components.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExtractProps<C> = C extends (props: infer P) => any
  ? P
  : C extends React.ComponentType<infer P>
    ? P
    : never;

type ExtractValue<C> =
  ExtractProps<C> extends { value?: infer V }
    ? NonNullable<V>
    : ExtractProps<C> extends { value: infer V }
      ? V
      : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FieldOwnProps<C extends React.ComponentType<any>> = {
  name: string;
  label: string;
  hint?: ReactNode;
  initialValue?: ExtractValue<C>;
  showValidationHints?: boolean;
  /**
   * Context required for context-dependent validations like unique, sameAs, etc.
   */
  validationContext?: ValidationContext;
  component: C;
} & Partial<ValidationProps>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FieldProps<C extends React.ComponentType<any>> = FieldOwnProps<C> &
  Omit<ExtractProps<C>, keyof FieldComponentProps | keyof ValidationProps>;

/**
 * Field component that connects to form context via useField hook.
 * Provides automatic state management, validation, and error display.
 *
 * For fields outside of form context, use UnconnectedField instead.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Field<C extends React.ComponentType<any>>({
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
}: FieldProps<C>) {
  const { id, containerProps, fieldProps, meta, validationSummary } = useField({
    name,
    initialValue,
    showValidationHints,
    validationContext,
    disabled,
    readOnly,
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
        <Component
          id={id}
          name={name}
          disabled={disabled}
          readOnly={readOnly}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {...(filterValidationProps(componentProps) as any)}
          {...fieldProps}
        />
      </BaseField>
    </LayoutGroup>
  );
}
