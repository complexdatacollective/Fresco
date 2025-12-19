'use client';

import { Radio } from '@base-ui/react/radio';
import { RadioGroup, type RadioGroupProps } from '@base-ui/react/radio-group';
import { motion, useMotionValue, useTransform } from 'motion/react';
import Button from '~/components/ui/Button';
import {
  controlLabelVariants,
  controlVariants,
  groupSpacingVariants,
  inputControlVariants,
  smallSizeVariants,
  stateVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx } from '~/utils/cva';

type BooleanOption = {
  label: string;
  value: boolean;
};

const buttonVariants = compose(
  controlVariants,
  inputControlVariants,
  groupSpacingVariants,
  stateVariants,
  cva({
    base: cx('elevation-low flex gap-3 text-left', 'focusable'),
    variants: {
      selected: {
        true: '',
        false: 'hover:border-accent/30',
      },
      positive: {
        true: 'outline-success!',
        false: 'outline-destructive!',
      },
    },
    compoundVariants: [
      {
        selected: true,
        positive: true,
        class: 'border-success',
      },
      {
        selected: true,
        positive: false,
        class: 'border-destructive',
      },
    ],
    defaultVariants: {
      selected: false,
      positive: true,
    },
  }),
);

const booleanIndicatorVariants = compose(
  smallSizeVariants,
  controlVariants,
  inputControlVariants,
  cva({
    base: cx(
      'flex aspect-square shrink-0 items-center justify-center rounded-full',
      'transition-colors duration-200',
    ),
    variants: {
      selected: {
        true: '',
        false: 'border-input-contrast/20',
      },
      positive: {
        true: '',
        false: '',
      },
      state: {
        disabled: '',
        readOnly: '',
        normal: '',
      },
    },
    compoundVariants: [
      {
        selected: true,
        positive: true,
        class: 'bg-success border-success text-success-contrast',
      },
      {
        selected: true,
        positive: false,
        class: 'bg-destructive border-destructive text-destructive-contrast',
      },
      {
        selected: false,
        state: 'normal',
        class: 'bg-input',
      },
      {
        selected: false,
        state: 'disabled',
        class: 'bg-input-contrast/5',
      },
      {
        selected: false,
        state: 'readOnly',
        class: 'bg-input-contrast/10',
      },
    ],
    defaultVariants: {
      selected: false,
      positive: true,
      state: 'normal',
    },
  }),
);

type BooleanFieldProps = Omit<
  RadioGroupProps,
  'onChange' | 'value' | 'defaultValue' | 'onValueChange'
> & {
  'value'?: boolean | null;
  'onChange'?: (value: boolean | null) => void;
  'disabled'?: boolean;
  'readOnly'?: boolean;
  'noReset'?: boolean;
  'label'?: string;
  'options'?: BooleanOption[];
  'aria-invalid'?: 'true' | 'false' | boolean;
};

type ButtonState = 'disabled' | 'readOnly' | 'normal';

function BooleanIndicator({
  isSelected,
  isPositive,
  state = 'normal',
}: {
  isSelected: boolean;
  isPositive: boolean;
  state?: ButtonState;
}) {
  const pathLength = useMotionValue(isSelected ? 1 : 0);
  const strokeLinecap = useTransform(() =>
    pathLength.get() === 0 ? 'butt' : 'round',
  );

  return (
    <div
      className={booleanIndicatorVariants({
        selected: isSelected,
        positive: isPositive,
        state,
      })}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-full w-full p-[0.15em]"
        stroke="currentColor"
        strokeWidth="3"
      >
        {isPositive ? (
          <motion.path
            d="M4 12L10 18L20 6"
            initial={false}
            animate={{ pathLength: isSelected ? 1 : 0 }}
            transition={{
              type: 'spring',
              bounce: 0,
              duration: isSelected ? 0.3 : 0.1,
            }}
            style={{
              pathLength,
              strokeLinecap,
            }}
          />
        ) : (
          <>
            <motion.path
              d="M6 6L18 18"
              initial={false}
              animate={{ pathLength: isSelected ? 1 : 0 }}
              transition={{
                type: 'spring',
                bounce: 0,
                duration: isSelected ? 0.3 : 0.1,
                delay: isSelected ? 0 : 0.05,
              }}
              style={{
                pathLength,
                strokeLinecap,
              }}
            />
            <motion.path
              d="M18 6L6 18"
              initial={false}
              animate={{ pathLength: isSelected ? 1 : 0 }}
              transition={{
                type: 'spring',
                bounce: 0,
                duration: isSelected ? 0.3 : 0.1,
                delay: isSelected ? 0.1 : 0,
              }}
              style={{
                pathLength,
                strokeLinecap,
              }}
            />
          </>
        )}
      </svg>
    </div>
  );
}

export function BooleanField({
  className,
  value,
  onChange,
  disabled = false,
  readOnly = false,
  noReset = false,
  label,
  options = [
    { label: 'Yes', value: true },
    { label: 'No', value: false },
  ],
  ...props
}: BooleanFieldProps) {
  const isInvalid =
    props['aria-invalid'] === 'true' || props['aria-invalid'] === true;

  const stringValue =
    value === null || value === undefined ? '' : String(value);

  const handleValueChange = (newValue: unknown) => {
    if (readOnly) return;
    onChange?.(newValue === 'true');
  };

  const getButtonState = (): ButtonState => {
    if (disabled) return 'disabled';
    if (readOnly) return 'readOnly';
    return 'normal';
  };

  const buttonState = getButtonState();

  return (
    <fieldset className={cx('w-full space-y-2 border-0 p-0', className)}>
      {label && <legend className="sr-only">{label}</legend>}
      <div
        className={cx(
          '-m-1 rounded-sm p-1',
          'transition-colors duration-200',
          isInvalid && 'border-destructive border-2',
        )}
      >
        <RadioGroup
          value={stringValue}
          onValueChange={handleValueChange}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={isInvalid || undefined}
          className="flex gap-2"
          {...props}
        >
          {options.map((option) => {
            const isSelected = value === option.value;
            const isPositive = option.value === true;
            const optionValue = String(option.value);

            return (
              <Radio.Root
                key={optionValue}
                value={optionValue}
                disabled={disabled}
                nativeButton
                render={(renderProps, _state) => (
                  <button
                    {...renderProps}
                    type="button"
                    className={buttonVariants({
                      selected: isSelected,
                      positive: isPositive,
                      state: buttonState,
                    })}
                  >
                    <BooleanIndicator
                      isSelected={isSelected}
                      isPositive={isPositive}
                      state={buttonState}
                    />
                    <span className={controlLabelVariants({ size: 'md' })}>
                      {option.label}
                    </span>
                  </button>
                )}
              />
            );
          })}
        </RadioGroup>
      </div>
      {!noReset && (
        <Button
          variant="link"
          onClick={() => onChange?.(null)}
          disabled={disabled || readOnly}
          size="xs"
        >
          Reset answer
        </Button>
      )}
    </fieldset>
  );
}
