import { Minus, Plus } from 'lucide-react';
import { forwardRef, useCallback, useRef, type ReactNode } from 'react';
import { IconButton } from '~/components/ui/Button';
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
      'w-auto',
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
      'field-sizing-content shrink-0 grow basis-0 border-none bg-transparent outline-none focus:ring-0',
      'transition-none',
      // Hide browser's native clear button on search inputs (we provide our own)
      '[&::-webkit-search-cancel-button]:hidden',
      '[&::-webkit-search-decoration]:hidden',
      // Hide browser's native spinner on number inputs (we provide our own)
      '[&::-webkit-outer-spin-button]:appearance-none',
      '[&::-webkit-inner-spin-button]:appearance-none',
      '[appearance:textfield]',
    ),
  }),
);

const stepperButtonVariants = cx(
  'aspect-square h-full! rounded-none',
  'elevation-none! translate-y-0!',
  'bg-input-contrast/5 text-input-contrast',
  'hover:bg-accent hover:text-accent-contrast',
  'disabled:pointer-events-none disabled:opacity-30',
);

type InputFieldProps = CreateFormFieldProps<
  string,
  'input',
  {
    size?: VariantProps<typeof textSizeVariants>['size'];
    prefixComponent?: ReactNode;
    suffixComponent?: ReactNode;
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
      ...inputProps
    } = props;

    const internalRef = useRef<HTMLInputElement>(null);
    const isNumber = type === 'number';
    const isInteractive = !disabled && !readOnly;

    const handleStep = useCallback((direction: 'up' | 'down') => {
      const input = internalRef.current;
      if (!input) return;

      if (direction === 'up') {
        input.stepUp();
      } else {
        input.stepDown();
      }

      // stepUp/stepDown don't fire change events, so dispatch one
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, []);

    const wrapperClassName = cx(
      inputWrapperVariants({ size, state: getInputState(props) }),
      isNumber && 'gap-0! px-0!',
      className,
    );

    const inputContent = (
      <>
        {prefix}
        <input
          ref={(node) => {
            internalRef.current = node;

            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          autoComplete="off"
          className={inputVariants({ className })}
          type={type}
          {...inputProps}
          onChange={(e) => onChange?.(e.target.value)}
          onWheel={(e) => {
            if (isNumber) {
              e.currentTarget.blur();
            }
          }}
          value={value ?? ''}
          disabled={disabled}
          readOnly={readOnly}
        />
        {suffix}
      </>
    );

    const inputElement = isNumber ? (
      <>
        <IconButton
          size={size}
          color="default"
          disabled={!isInteractive}
          onClick={() => handleStep('down')}
          aria-label="Decrease value"
          tabIndex={-1}
          icon={<Minus />}
          className={stepperButtonVariants}
        />
        <div
          className={cx(
            'flex min-w-0 grow items-center',
            inlineSpacingVariants(),
            wrapperPaddingVariants(),
          )}
        >
          {inputContent}
        </div>
        <IconButton
          size={size}
          color="default"
          disabled={!isInteractive}
          onClick={() => handleStep('up')}
          aria-label="Increase value"
          tabIndex={-1}
          icon={<Plus />}
          className={stepperButtonVariants}
        />
      </>
    ) : (
      inputContent
    );

    return <div className={wrapperClassName}>{inputElement}</div>;
  },
);

export default InputField;
