import { type ReactNode } from 'react';
import {
  controlVariants,
  inlineSpacingVariants,
  inputControlVariants,
  interactiveStateVariants,
  placeholderVariants,
  proportionalLucideIconVariants,
  sizeVariants,
  stateVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx } from '~/utils/cva';

const inputWrapperVariants = compose(
  sizeVariants,
  controlVariants,
  inputControlVariants,
  inlineSpacingVariants,
  proportionalLucideIconVariants,
  stateVariants,
  interactiveStateVariants,
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
  size = 'md',
  className,
  value,
  ...inputProps
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  prefixComponent?: ReactNode;
  suffixComponent?: ReactNode;
}) {
  // Calculate state based on props. Order: disabled > readOnly > invalid > normal
  const getState = () => {
    if (inputProps.disabled) return 'disabled';
    if (inputProps['aria-invalid']) return 'invalid';
    if (inputProps.readOnly) return 'readOnly';
    return 'normal';
  };

  return (
    <div
      className={cx(
        inputWrapperVariants({ size, state: getState() }),
        className,
      )}
    >
      {prefix}
      <input
        autoComplete="off"
        className={inputVariants({ className })}
        value={value ?? ''} // Value can't be undefined for input components or React assumes it is uncontrolled
        {...inputProps}
      />
      {suffix}
    </div>
  );
};
