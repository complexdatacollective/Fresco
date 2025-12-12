'use client';

import { useField } from '../hooks/useField';
import { BaseField } from './BaseField';
import { type FieldValidation, type FieldValue } from './types';

/**
 * Props that Field provides to components.
 * These are excluded from FieldProps since they're always provided by Field.
 */
type FieldComponentProps = {
  'id': string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  'value'?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  'onChange': (value: any) => void;
  'onBlur': (e: React.FocusEvent) => void;
  'aria-required': boolean;
  'aria-invalid': boolean;
  'aria-describedby': string;
};

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
  hint?: string;
  initialValue?: ExtractValue<C>;
  required?: boolean;
  validation?: FieldValidation;
  component: C;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FieldProps<C extends React.ComponentType<any>> = FieldOwnProps<C> &
  Omit<ExtractProps<C>, keyof FieldComponentProps>;

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
  required,
  validation,
  component: Component,
  ...componentProps
}: FieldProps<C>) {
  const { id, containerProps, fieldProps, meta } = useField({
    name,
    initialValue: initialValue as FieldValue | undefined,
    required,
    validation,
  });

  return (
    <BaseField
      id={id}
      label={label}
      hint={hint}
      required={required}
      errors={meta.errors}
      showErrors={meta.shouldShowError}
      containerProps={containerProps}
    >
      <Component
        id={id}
        name={name}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...(componentProps as any)}
        {...fieldProps}
      />
    </BaseField>
  );
}
