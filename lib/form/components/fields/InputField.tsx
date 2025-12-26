import React, { type ReactNode, useCallback } from 'react';
import {
  controlVariants,
  heightVariants,
  inlineSpacingVariants,
  inputControlVariants,
  interactiveStateVariants,
  placeholderVariants,
  proportionalLucideIconVariants,
  stateVariants,
  textSizeVariants,
  wrapperPaddingVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx, type VariantProps } from '~/utils/cva';
import { getInputState } from '../../utils/getInputState';
import { type CreateFieldProps } from '../Field/Field';

const inputWrapperVariants = compose(
  heightVariants,
  textSizeVariants,
  controlVariants,
  inputControlVariants,
  inlineSpacingVariants,
  wrapperPaddingVariants,
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
      '[font-size:inherit]', // Ensure input inherits text size from wrapper
      'p-0',
      'h-full w-full shrink-0 grow basis-0 border-none bg-transparent outline-none focus:ring-0',
      'transition-none',
    ),
  }),
);

type InputFieldProps = CreateFieldProps<
  React.InputHTMLAttributes<HTMLInputElement>
> & {
  type?: string;
  size?: VariantProps<typeof textSizeVariants>['size'];
  prefixComponent?: ReactNode;
  suffixComponent?: ReactNode;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
};

export const InputField = function InputField(props: InputFieldProps) {
  const {
    prefixComponent: prefix,
    suffixComponent: suffix,
    size = 'md',
    className,
    value,
    onChange,
    type = 'text',
    disabled,
    readOnly,
    ...inputProps
  } = props;

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(event.target.value);
    },
    [onChange],
  );

  return (
    <div
      className={cx(
        inputWrapperVariants({ size, state: getInputState(props) }),
        className,
      )}
    >
      {prefix}
      <input
        autoComplete="off" // Default to off to avoid browser autofill styles
        className={inputVariants({ className })}
        type={type}
        {...inputProps}
        onChange={handleChange}
        value={value}
        disabled={disabled}
        readOnly={readOnly}
      />
      {suffix}
    </div>
  );
};
