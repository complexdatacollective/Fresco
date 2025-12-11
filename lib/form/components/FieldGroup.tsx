import { AnimatePresence } from 'motion/react';
import { type ReactNode, useMemo } from 'react';
import { useFormValue } from '../hooks/useFormValue';
import { type FieldValue } from './types';

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
type FieldGroupProps<T extends readonly string[]> = {
  watch: T;
  condition: (values: Record<T[number], FieldValue | undefined>) => boolean;
  children: ReactNode;
};

// Component with proper type inference using const type parameter
function FieldGroup<const T extends readonly string[]>({
  watch,
  condition,
  children,
}: FieldGroupProps<T>) {
  const shouldRender = useFieldGroupCondition(watch, condition);

  return (
    <AnimatePresence mode="popLayout">
      {shouldRender === true && <>{children}</>}
    </AnimatePresence>
  );
}

export default FieldGroup;
