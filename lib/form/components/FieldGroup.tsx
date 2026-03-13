import { AnimatePresence } from 'motion/react';
import { type ReactNode, useMemo } from 'react';
import { useFormValue } from '../hooks/useFormValue';
import { type FieldValue } from '../store/types';

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

/**
 * A component that conditionally renders its children based on the values of specified form fields.
 *
 * @param watch - An array of form field names to watch for changes.
 * @param condition - A function that takes the current values of the watched fields and returns a boolean indicating whether to render the children.
 * @param children - The form fields or components to conditionally render.
 *
 * @example
 * <FieldGroup
 *   watch={['hasNickname']}
 *   condition={(values) => values.hasNickname === true}
 * >
 *   <Field name="nickname" label="Nickname" component={InputField} />
 * </FieldGroup>
 */
function FieldGroup<const T extends readonly string[]>({
  watch,
  condition,
  children,
}: FieldGroupProps<T>) {
  const shouldRender = useFieldGroupCondition(watch, condition);

  return (
    <AnimatePresence mode="sync">
      {shouldRender === true && <>{children}</>}
    </AnimatePresence>
  );
}

export default FieldGroup;
