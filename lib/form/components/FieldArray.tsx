'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import {
  useFieldArray,
  type FieldArrayFields,
  type UseFieldArrayMeta,
} from '../hooks/useFieldArray';
import { FieldLabel } from './FieldLabel';
import Hint from './Hint';

export type FieldArrayRenderProps<T = Record<string, unknown>> = {
  fields: FieldArrayFields<T>;
  meta: UseFieldArrayMeta;
};

export type FieldArrayProps<T = Record<string, unknown>> = {
  name: string;
  label?: string;
  hint?: string;
  initialValue?: T[];
  children: (props: FieldArrayRenderProps<T>) => ReactNode;
};

/**
 * FieldArray component for managing arrays of fields in forms.
 * Uses a render prop pattern to give full control over how array items are rendered.
 *
 * The nested Field components handle their own values and registration with the form store.
 * Use `fields.get(index)` to access initial values for nested fields.
 *
 * @example
 * ```tsx
 * <FieldArray<Person> name="people" label="People" initialValue={[{ firstName: 'John' }]}>
 *   {({ fields }) => (
 *     <>
 *       {fields.map((key, index) => (
 *         <div key={key}>
 *           <Field
 *             name={`people[${index}].firstName`}
 *             component={Input}
 *             label="First Name"
 *             initialValue={fields.get(index)?.firstName}
 *           />
 *           <button onClick={() => fields.remove(index)}>Remove</button>
 *         </div>
 *       ))}
 *       <button onClick={() => fields.push({ firstName: '' })}>
 *         Add Person
 *       </button>
 *     </>
 *   )}
 * </FieldArray>
 * ```
 */
export default function FieldArray<T = Record<string, unknown>>({
  name,
  label,
  hint,
  initialValue,
  children,
}: FieldArrayProps<T>) {
  const { id, fields, meta } = useFieldArray<T>({
    name,
    initialValue,
  });

  return (
    <motion.div
      data-field-name={name}
      data-dirty={meta.isDirty}
      data-touched={meta.isTouched}
      className="group w-full grow"
    >
      {label && (
        <FieldLabel id={`${id}-label`} htmlFor={id}>
          {label}
        </FieldLabel>
      )}
      {hint && <Hint id={`${id}-hint`}>{hint}</Hint>}
      {children({ fields, meta })}
    </motion.div>
  );
}

export {
  type FieldArrayFields,
  type FieldArrayItemWrapper,
  type UseFieldArrayMeta,
} from '../hooks/useFieldArray';
