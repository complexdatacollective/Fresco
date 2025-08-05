import { type z } from 'zod';
import { type FieldValue } from '~/lib/interviewer/utils/field-validation';
import { useField } from '../hooks/useField';
import { type ValidationContext } from '../types';

/**
 * Wrapper that connects a field to the form context, and handles validation
 * and state.
 *
 * additionalFieldProps should be typed to match the specific field component
 * being used, allowing for additional props to be passed through.
 *
 * It would be ideal if FormContextType and FieldContextType were able to be
 * inferred somehow.
 */
export default function Field<
  TFieldProps extends Record<string, unknown> = Record<string, unknown>,
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
  Component: React.ElementType;
} & TFieldProps) {
  /**
   * This hook connects the field to the form context, backed by the zustand
   * store. The store tracks field state, the hook handles subscription to
   * changes, and provides the necessary props to the field component.
   */
  const fieldProps = useField({
    name,
    initialValue,
    validation,
  });

  return <Component name={name} {...fieldProps} {...additionalFieldProps} />;
}
