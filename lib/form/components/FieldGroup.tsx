import { type HTMLAttributes, type ReactNode, useMemo } from 'react';
import { type FieldValue } from '~/lib/interviewer/utils/field-validation';
import { useFormValue } from '../hooks/useFormValue';

// Custom hook to optimize condition evaluation
function useFieldGroupCondition<const T extends readonly string[]>(
  watch: T,
  condition: (values: Record<T[number], FieldValue | undefined>) => boolean,
) {
  const values = useFormValue(watch);
  
  // Memoize the condition result to prevent unnecessary re-renders
  // Only re-evaluate when values change
  return useMemo(() => condition(values), [values, condition]);
}

// FieldGroup props that infers literal string types from the watch array
type FieldGroupProps<T extends readonly string[]> =
  HTMLAttributes<HTMLFieldSetElement> & {
    watch: T;
    condition: (values: Record<T[number], FieldValue | undefined>) => boolean;
    children: ReactNode;
  };

// Component with proper type inference using const type parameter
function FieldGroup<const T extends readonly string[]>({
  watch,
  condition,
  children,
  ...fieldsetProps
}: FieldGroupProps<T>) {
  const shouldRender = useFieldGroupCondition(watch, condition);

  if (!shouldRender) {
    return null;
  }

  return <fieldset {...fieldsetProps}>{children}</fieldset>;
}

export default FieldGroup;
