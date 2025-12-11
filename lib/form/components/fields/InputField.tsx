import { type ReactNode } from 'react';
import {
  controlContainerVariants,
  controlStateVariants,
  inlineSpacingVariants,
  placeholderVariants,
  proportionalLucideIconVariants,
  sizeVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx } from '~/utils/cva';

const inputWrapperVariants = compose(
  sizeVariants,
  proportionalLucideIconVariants,
  inlineSpacingVariants,
  controlContainerVariants,
  controlStateVariants,
  cva({
    base: 'w-full',
  }),
);

// Input element when used with wrapper (prefix/suffix)
export const inputVariants = compose(
  placeholderVariants,
  cva({
    base: cx(
      'cursor-[inherit]',
      'p-0',
      'h-full w-full shrink grow basis-0 border-none bg-transparent outline-none focus:ring-0',
      'shrink-0 grow',
      'transition-none',
    ),
  }),
);

export const InputField = function InputField({
  prefixComponent: prefix,
  suffixComponent: suffix,
  className,
  ...inputProps
}: React.InputHTMLAttributes<HTMLInputElement> & {
  prefixComponent?: ReactNode;
  suffixComponent?: ReactNode;
}) {
  return (
    <div className={cx(inputWrapperVariants({ size: 'md' }), className)}>
      {prefix}
      <input
        autoComplete="off"
        className={inputVariants({ className })}
        {...inputProps}
      />
      {suffix}
    </div>
  );
};
