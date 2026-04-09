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
      // `controlVariants` sets `min-w-fit` (sensible for buttons whose
      // label should never be clipped), but combined with
      // `field-sizing-content` on the inner `<input>` that produces a
      // wrapper whose min-width is the input's entire content width —
      // so pasting e.g. an UploadThing API token (~200 chars, no
      // whitespace) causes the whole settings field to overflow its
      // container. `min-w-0` lets flex shrink the wrapper below its
      // intrinsic content size; combined with `min-w-0` on the inner
      // `<input>` (see `inputVariants` below), text is clipped inside
      // a container-sized field instead of blowing out the layout.
      'min-w-0',
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
      // `field-sizing-content` sets the intrinsic width to the content,
      // so very long single-token values (e.g. an UploadThing API token)
      // would blow out the flex parent unless we let flex shrink the
      // input. `min-w-0` + default `shrink: 1` lets it collapse to fit
      // the container; `grow basis-0` makes it expand to fill any
      // remaining space when the content is short.
      'field-sizing-content min-w-0 grow basis-0',
      'border-none bg-transparent outline-none focus:ring-0',
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
    // Forwards the native React ChangeEvent to the caller. Needed when
    // InputField is used as a base-ui `render` prop (e.g. Combobox.Input),
    // because base-ui's internal onChange handler expects the full event
    // (it reads event.nativeEvent.inputType), while InputField's own
    // onChange only passes the string value.
    nativeOnChange?: React.ChangeEventHandler<HTMLInputElement>;
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
      nativeOnChange,
      type = 'text',
      disabled,
      readOnly,
      ...inputProps
    } = props;

    const internalRef = useRef<HTMLInputElement>(null);
    const isNumber = type === 'number';
    const isInteractive = !disabled && !readOnly;

    const handleStep = useCallback(
      (direction: 'up' | 'down') => {
        const input = internalRef.current;
        if (!input) return;

        if (direction === 'up') {
          input.stepUp();
        } else {
          input.stepDown();
        }

        // stepUp/stepDown don't fire change events, so notify React directly
        onChange?.(input.value);
      },
      [onChange],
    );

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
          onChange={(e) => {
            onChange?.(e.target.value);
            nativeOnChange?.(e);
          }}
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
