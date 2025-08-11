import { type ElementType } from 'react';
import { type z } from 'zod';
import { type FieldValue } from '~/lib/interviewer/utils/field-validation';
import { useField, type UseFieldKeys } from '../hooks/useField';
import { type ValidationContext } from '../types';

/**
 * Wrapper that connects a field to the form context, and handles validation
 * and state.
 *
 * additionalFieldProps should be typed to match the specific field component
 * being used, allowing for additional props to be passed through.
 */
export default function Field<
  TComponent extends React.ElementType,
  TComponentProps = React.ComponentPropsWithoutRef<TComponent>,
>({
  name,
  initialValue,
  validation,
  Component,
  ...additionalFieldProps
}: {
  name: string;
  initialValue?: FieldValue;
  validation?: z.ZodTypeAny | ((context: ValidationContext) => z.ZodTypeAny);
  Component: TComponent;
} & Omit<TComponentProps, UseFieldKeys>) {
  const fieldProps = useField({
    name,
    initialValue,
    validation,
  });

  const FieldComponent = Component as ElementType;

  return (
    <FieldComponent name={name} {...fieldProps} {...additionalFieldProps} />
  );
}
