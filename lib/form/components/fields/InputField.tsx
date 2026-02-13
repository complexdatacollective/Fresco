import { motion } from 'motion/react';
import { forwardRef, type ReactNode } from 'react';
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
import { type CreateFormFieldProps } from '../Field/types';

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
    base: cx(
      'w-full',
      // Child buttons should have reduced height, but their icons should stay the same size
      '[&_button]:h-10',
    ),
  }),
);

// Input element when used with wrapper (prefix/suffix)
const inputVariants = compose(
  placeholderVariants,
  cva({
    base: cx(
      'cursor-[inherit]',
      '[font-size:inherit]', // Ensure input inherits text size from wrapper
      'p-0',
      'size-full shrink-0 grow basis-0 border-none bg-transparent outline-none focus:ring-0',
      'transition-none',
      // Hide browser's native clear button on search inputs (we provide our own)
      '[&::-webkit-search-cancel-button]:hidden',
      '[&::-webkit-search-decoration]:hidden',
    ),
  }),
);

type InputFieldProps = CreateFormFieldProps<
  string,
  'input',
  {
    size?: VariantProps<typeof textSizeVariants>['size'];
    prefixComponent?: ReactNode;
    suffixComponent?: ReactNode;
    layout?: 'position' | 'size' | false;
  }
>;

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  function InputField(props, ref) {
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
      layout = 'position',
      ...inputProps
    } = props;

    return (
      <motion.div
        layout={layout}
        className={cx(
          inputWrapperVariants({ size, state: getInputState(props) }),
          className,
        )}
      >
        {prefix}
        <input
          ref={ref}
          autoComplete="off" // Default to off to avoid browser autofill styles
          className={inputVariants({ className })}
          type={type}
          {...inputProps}
          onChange={(e) => onChange?.(e.target.value)}
          value={value ?? ''}
          disabled={disabled}
          readOnly={readOnly}
        />
        {suffix}
      </motion.div>
    );
  },
);

export default InputField;
