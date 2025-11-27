import { CircleCheck, CircleX } from 'lucide-react';
import { motion } from 'motion/react';
import { type ReactNode } from 'react';
import {
  controlContainerVariants,
  controlStateVariants,
  placeholderVariants,
  proportionalLucideIconVariants,
  sizeVariants,
  spacingVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx } from '~/utils/cva';

const inputWrapperVariants = compose(
  sizeVariants,
  proportionalLucideIconVariants,
  spacingVariants,
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
    <motion.div
      layout
      className={cx(inputWrapperVariants({ size: 'md' }), className)}
    >
      {prefix}
      <input
        autoComplete="off"
        className={inputVariants({ className })}
        {...inputProps}
      />
      <CircleCheck className="text-success hidden group-data-[touched=true]:group-data-[valid=true]:block" />
      <CircleX className="text-destructive hidden group-data-[touched=true]:group-data-[invalid=true]:block" />
      {suffix}
    </motion.div>
  );
};
