'use client';

import { type ComponentProps, forwardRef } from 'react';
import {
  controlContainerVariants,
  controlStateVariants,
  placeholderVariants,
  spacingVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx, type VariantProps } from '~/utils/cva';

const textareaWrapperVariants = compose(
  spacingVariants,
  controlContainerVariants,
  controlStateVariants,
  cva({
    base: 'w-full',
  }),
);

const textareaVariants = compose(
  placeholderVariants,
  cva({
    base: cx(
      'w-full h-full resize-y min-h-[120px]',
      'p-0 border-none bg-transparent outline-none focus:ring-0',
      'cursor-[inherit]',
    ),
    variants: {
      size: {
        xs: 'py-1',
        sm: 'py-2',
        md: 'py-3',
        lg: 'py-4',
        xl: 'py-5',
      },
    },
  }),
);

type TextAreaFieldProps = Omit<
  ComponentProps<'textarea'>,
  'size' | 'onChange'
> &
  VariantProps<typeof textareaWrapperVariants> & {
    size?: VariantProps<typeof textareaWrapperVariants>['size'];
    onChange?: (value: string) => void;
  };

export const TextAreaField = forwardRef<
  HTMLTextAreaElement,
  TextAreaFieldProps
>(function TextAreaField(
  { className, size, onChange, disabled, ...textareaProps },
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
        size,
        className,
        state: getState(),
      })}
    >
      <textarea
        ref={ref}
        {...textareaProps}
        disabled={disabled}
        onChange={handleChange}
        className={textareaVariants({ size })}
      />
    </div>
  );
});
