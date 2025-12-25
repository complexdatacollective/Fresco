import { type ReactNode } from 'react';
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
import { type FieldComponentProps } from '../Field';

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

type InputFieldProps = FieldComponentProps &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange'> & {
    size?: VariantProps<typeof textSizeVariants>['size'];
    prefixComponent?: ReactNode;
    suffixComponent?: ReactNode;
    /**
     * Type-safe change handler.
     * - For type="number": receives number (or undefined when input is empty)
     * - For all other types: receives the string value
     * - Also accepts standard React.ChangeEvent handler for backward compatibility
     */
    onChange?:
      | ((value: string) => void)
      | ((value: number | undefined) => void)
      | React.ChangeEventHandler<HTMLInputElement>;
  };

export const InputField = function InputField(props: InputFieldProps) {
  const {
    prefixComponent: prefix,
    suffixComponent: suffix,
    size = 'md',
    className,
    value,
    onChange,
    type,
    ...inputProps
  } = props;

  // Calculate state based on props. Order: disabled > readOnly > invalid > normal
  const getState = () => {
    if (inputProps.disabled) return 'disabled';
    if (inputProps['aria-invalid']) return 'invalid';
    if (inputProps.readOnly) return 'readOnly';
    return 'normal';
  };

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    if (!onChange) return;

    // Check if the onChange handler expects an event (has 'target' check or takes event param)
    // by checking if it's a function that, when called with a primitive, throws or returns undefined
    // Simpler approach: check function length - event handlers typically expect 1 arg (event)
    // and our value handlers also expect 1 arg, so we differentiate by type
    if (type === 'number') {
      const numValue =
        e.target.value === '' ? undefined : e.target.valueAsNumber;
      // For number inputs, call with number | undefined
      (onChange as (value: number | undefined) => void)(numValue);
    } else {
      // For other inputs, call with string value
      (onChange as (value: string) => void)(e.target.value);
    }
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
        type={type}
        {...inputProps}
        onChange={handleChange}
        value={value}
      />
      {suffix}
    </div>
  );
};
