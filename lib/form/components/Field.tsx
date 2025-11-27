'use client';

import { LayoutGroup, motion } from 'motion/react';
import { useField } from '../hooks/useField';
import { type FieldValidation } from '../types';
import FieldErrors from './FieldErrors';
import { FieldLabel } from './FieldLabel';
import Hint from './Hint';

type InputProps<T = unknown> = {
  value: T;
  onChange: (value: T) => void;
};

/**
 * Extract the value type from a component's props
 */
type ExtractValue<C> =
  C extends React.ComponentType<infer P>
    ? P extends { value?: infer V }
      ? NonNullable<V>
      : P extends { value: infer V }
        ? V
        : never
    : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FieldOwnProps<C extends React.ComponentType<InputProps<any>>> = {
  name: string;
  label: string;
  hint?: string;
  initialValue?: ExtractValue<C>;
  required?: boolean;
  validation?: FieldValidation;
  component: C;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FieldProps<C extends React.ComponentType<InputProps<any>>> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FieldOwnProps<C> & Omit<React.ComponentProps<C>, keyof InputProps<any>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Field<C extends React.ComponentType<InputProps<any>>>({
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
    initialValue,
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
