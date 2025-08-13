'use client';

import { motion } from 'motion/react';
import { type ElementType } from 'react';
import { type z } from 'zod';
import { type FieldValue } from '~/lib/interviewer/utils/field-validation';
import { cva } from '~/utils/cva';
import { useField, type UseFieldKeys } from '../hooks/useField';
import { type BaseFieldProps, type ValidationContext } from '../types';
import { getInputState } from '../utils/getInputState';
import FieldErrors from './FieldErrors';
import Hint from './Hint';
import { Label } from './Label';

export const containerVariants = cva({
  base: 'grid gap-3 not-first:mt-6',
  variants: {
    state: {
      valid: 'border-success',
      warning: 'border-warning',
      invalid: 'border-destructive',
      disabled: 'opacity-50 cursor-not-allowed',
    },
  },
});

// Animation variants for field mount/unmount and layout changes
export const fieldAnimationVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
};

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
  label,
  hint,
  initialValue,
  validation,
  Component,
  ...additionalFieldProps
}: {
  name: string;
  initialValue?: FieldValue;
  validation?: z.ZodTypeAny | ((context: ValidationContext) => z.ZodTypeAny);
  Component: TComponent;
} & BaseFieldProps &
  Omit<TComponentProps, UseFieldKeys>) {
  const { id, meta, fieldProps, containerProps } = useField({
    name,
    initialValue,
    validation,
  });

  const FieldComponent = Component as ElementType;

  const inputVariantState = getInputState(meta);

  return (
    <motion.div
      key={id}
      className={containerVariants({ state: inputVariantState })}
      variants={fieldAnimationVariants}
      layoutId={name}
      initial="initial"
      animate="animate"
      exit="exit"
      layout="position"
      {...containerProps}
    >
      <div>
        <Label id={`${id}-label`} htmlFor={id}>
          {label}
        </Label>
        {hint && (
          <Hint id={`${id}-hint`} validation={validation}>
            {hint}
          </Hint>
        )}
      </div>
      <FieldComponent
        name={name}
        id={id}
        {...fieldProps}
        {...additionalFieldProps}
      />
      <FieldErrors
        id={`${id}-error`}
        errors={meta.errors}
        show={meta.shouldShowError}
      />
    </motion.div>
  );
}
