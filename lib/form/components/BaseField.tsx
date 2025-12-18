'use client';

import { motion } from 'motion/react';
import { type ReactNode } from 'react';
import FieldErrors from './FieldErrors';
import { FieldLabel } from './FieldLabel';
import Hint from './Hint';

export type BaseFieldProps = {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  errors?: string[];
  showErrors?: boolean;
  children: ReactNode;
  // TODO: the data attributes should be typed based on the return value of useField.
  containerProps?: Omit<HTMLDivElement, 'className'> &
    Record<`data-${string}`, string | boolean | undefined>;
};

/**
 * BaseField provides the shared markup/layout for form fields.
 * Used internally by Field (connected) and UnconnectedField (standalone).
 */
export function BaseField({
  id,
  label,
  hint,
  required,
  errors = [],
  showErrors = false,
  children,
  containerProps,
}: BaseFieldProps) {
  return (
    <motion.div
      key={id}
      layout
      {...containerProps}
      className="group w-full grow not-last-of-type:mb-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <FieldLabel id={`${id}-label`} htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      {hint && <Hint id={`${id}-hint`}>{hint}</Hint>}
      {children}
      <FieldErrors id={`${id}-error`} errors={errors} show={showErrors} />
    </motion.div>
  );
}
