'use client';

import { motion } from 'motion/react';
import { cva } from '~/utils/cva';
import { useField, type UseFieldKeys } from '../hooks/useField';
import {
  type BaseFieldProps,
  type FieldValidation,
  type FieldValue,
} from '../types';
import FieldErrors from './FieldErrors';
import { FieldLabel } from './FieldLabel';
import Hint from './Hint';

export const containerVariants = cva({
  base: 'grid gap-3 not-first:mt-6',
  variants: {
    state: {
      valid: 'border-success',
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
  // TComponent must extend from a HTMLInputElement to ensure compatibility
  TComponent extends React.ElementType<HTMLInputElement>,
  TComponentProps = React.ComponentProps<TComponent>,
>({
  showRequired,
  name,
  label,
  hint,
  initialValue,
  validation,
  Component,
  ...additionalFieldProps
}: {
  showRequired?: boolean;
  name: string;
  initialValue?: FieldValue;
  validation?: FieldValidation;
  Component: TComponent;
} & BaseFieldProps &
  Omit<TComponentProps, UseFieldKeys>) {
  const { id, meta, fieldProps, containerProps } = useField({
    name,
    initialValue,
    validation,
    showRequired: Boolean(showRequired),
  });

  const FieldComponent = Component;

  // Auto-detect if component needs fieldset mode via static property
  const needsFieldset = 'fieldsetMode' in Component && Component.fieldsetMode;

  // Choose wrapper element based on fieldset mode
  const WrapperElement = needsFieldset ? 'fieldset' : 'div';

  return (
    <motion.div
      key={id}
      // className={containerVariants({ state: inputVariantState })}
      variants={fieldAnimationVariants}
      layoutId={name}
      initial="initial"
      animate="animate"
      exit="exit"
      layout="position"
      {...containerProps}
    >
      <WrapperElement>
        <FieldLabel
          id={`${id}-label`}
          htmlFor={!needsFieldset ? id : undefined}
          required={showRequired}
          render={needsFieldset ? <legend /> : undefined}
        >
          {label}
        </FieldLabel>
        <FieldComponent
          name={name}
          {...fieldProps}
          {...additionalFieldProps}
          id={id}
        />
      </WrapperElement>
      {hint && <Hint id={`${id}-hint`}>{hint}</Hint>}
      <FieldErrors
        id={`${id}-error`}
        errors={meta.errors}
        show={meta.shouldShowError}
      />
    </motion.div>
  );
}
