'use client';

import { type TextareaHTMLAttributes } from 'react';
import { cx } from '~/utils/cva';
import {
  backgroundStyles,
  borderStyles,
  cursorStyles,
  focusRingStyles,
  sizeStyles,
  textStyles,
  transitionStyles,
} from './shared';

export const textareaFocusStyles = cx(
  borderStyles.focus,
  borderStyles.focusInvalid,
  borderStyles.focusReadOnly,
  focusRingStyles.base,
  focusRingStyles.invalid,
);

export const textareaStyles = cx(
  'w-full resize-y min-h-[120px]',
  transitionStyles,
  borderStyles.base,
  borderStyles.invalid,
  backgroundStyles.base,
  backgroundStyles.disabled,
  backgroundStyles.readOnly,
  textareaFocusStyles,
  textStyles.base,
  textStyles.invalid,
  textStyles.disabled,
  textStyles.readOnly,
  cursorStyles.disabled,
  cursorStyles.readOnly,
  sizeStyles.md.text,
  sizeStyles.md.padding,
);

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextAreaField({
  className,
  ...textareaProps
}: TextAreaFieldProps) {
  return (
    <textarea {...textareaProps} className={cx(textareaStyles, className)} />
  );
}
