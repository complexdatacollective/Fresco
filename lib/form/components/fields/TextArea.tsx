'use client';

import { type ComponentProps, forwardRef } from 'react';
import {
  controlVariants,
  inputControlVariants,
  interactiveStateVariants,
  multilineContentVariants,
  placeholderVariants,
  stateVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx, type VariantProps } from '~/utils/cva';

const textareaWrapperVariants = compose(
  controlVariants,
  inputControlVariants,
  stateVariants,
  interactiveStateVariants,
  cva({
    base: 'h-auto w-full',
  }),
);

const textareaVariants = compose(
  placeholderVariants,
  multilineContentVariants,
  cva({
    base: cx(
      'h-full w-full resize-y',
      'border-none bg-transparent outline-none focus:ring-0',
      'cursor-[inherit]',
    ),
  }),
);

type TextAreaFieldProps = Omit<ComponentProps<'textarea'>, 'onChange'> &
  VariantProps<typeof textareaWrapperVariants> & {
    onChange?: (value: string) => void;
  };

export const TextAreaField = forwardRef<
  HTMLTextAreaElement,
  TextAreaFieldProps
>(function TextAreaField(
  { className, onChange, disabled, ...textareaProps },
  ref,
) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  };

  // Work out variant state based on props. Order:
  // disabled > readOnly > invalid > normal
  const getState = () => {
    if (disabled) return 'disabled';
    if (textareaProps.readOnly) return 'readOnly';
    if (textareaProps['aria-invalid']) return 'invalid';
    return 'normal';
  };

  return (
    <div
      className={textareaWrapperVariants({
        className,
        state: getState(),
      })}
    >
      <textarea
        ref={ref}
        {...textareaProps}
        disabled={disabled}
        onChange={handleChange}
        className={textareaVariants()}
      />
    </div>
  );
});
