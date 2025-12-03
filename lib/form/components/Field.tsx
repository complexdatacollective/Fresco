'use client';

import { LayoutGroup, motion } from 'motion/react';
import { useField } from '../hooks/useField';
import FieldErrors from './FieldErrors';
import { FieldLabel } from './FieldLabel';
import Hint from './Hint';
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
type FieldOwnProps<C extends React.ComponentType<any>> = {
  name: string;
  label: string;
  hint?: string;
  initialValue?: ExtractValue<C>;
  required?: boolean;
  validation?: FieldValidation;
  component: C;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FieldProps<C extends React.ComponentType<any>> = FieldOwnProps<C> &
  Omit<ExtractProps<C>, keyof FieldComponentProps>;

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
    <LayoutGroup>
      <motion.div
        layout
        {...containerProps}
        className="group w-full grow not-last-of-type:mb-6"
      >
        <FieldLabel id={`${id}-label`} htmlFor={id} required={required}>
          {label}
        </FieldLabel>
        {hint && <Hint id={`${id}-hint`}>{hint}</Hint>}
        <Component
          id={id}
          name={name}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {...(componentProps as any)}
          {...fieldProps}
        />
        <FieldErrors
          id={`${id}-error`}
          errors={meta.errors}
          show={meta.shouldShowError}
        />
      </motion.div>
    </LayoutGroup>
  );
}
