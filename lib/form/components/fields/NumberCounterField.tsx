'use client';

import { Minus, Plus } from 'lucide-react';
import { useCallback } from 'react';
import { IconButton } from '~/components/ui/Button';
import { Key, useKeyboardShortcuts } from '~/hooks/useKeyboardShortcuts';
import {
  controlVariants,
  heightVariants,
  inlineSpacingVariants,
  inputControlVariants,
  interactiveStateVariants,
  proportionalLucideIconVariants,
  stateVariants,
  textSizeVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx, type VariantProps } from '~/utils/cva';
import { AnimateNumber } from '../../../../components/ui/AnimateNumber';
import { getInputState } from '../../utils/getInputState';
import { type CreateFormFieldProps } from '../Field/types';

const numberCounterWrapperVariants = compose(
  heightVariants,
  textSizeVariants,
  controlVariants,
  inputControlVariants,
  inlineSpacingVariants,
  proportionalLucideIconVariants,
  stateVariants,
  interactiveStateVariants,
  cva({
    base: 'w-auto select-none',
  }),
);

const numberDisplayVariants = compose(
  textSizeVariants,
  cva({
    base: 'font-monospace mx-4 text-center tabular-nums',
  }),
);

type NumberCounterFieldProps = CreateFormFieldProps<
  number,
  'div',
  {
    step?: number;
    size?: VariantProps<typeof numberCounterWrapperVariants>['size'];
    minValue?: number;
    maxValue?: number;
  }
>;

export default function NumberCounterField(props: NumberCounterFieldProps) {
  const {
    id,
    name,
    'value': rawValue,
    onChange,
    minValue = -Infinity,
    maxValue = Infinity,
    step = 1,
    size = 'md',
    className,
    'aria-required': ariaRequired,
    'aria-invalid': ariaInvalid,
    'aria-describedby': ariaDescribedBy,
    ...restProps
  } = props;

  const value = typeof rawValue === 'number' ? rawValue : 0;
  const state = getInputState(props);

  const clampValue = useCallback(
    (val: number) => Math.min(Math.max(val, minValue), maxValue),
    [minValue, maxValue],
  );

  const roundToStep = useCallback(
    (val: number) => {
      const precision = String(step).split('.')[1]?.length ?? 0;
      return Number(val.toFixed(precision));
    },
    [step],
  );

  const setValue = useCallback(
    (newValue: number) => {
      const clamped = roundToStep(clampValue(newValue));
      onChange?.(clamped);
    },
    [clampValue, roundToStep, onChange],
  );

  const handleIncrement = useCallback(() => {
    setValue(value + step);
  }, [value, step, setValue]);

  const handleDecrement = useCallback(() => {
    setValue(value - step);
  }, [value, step, setValue]);

  const keyboardHandlers = useKeyboardShortcuts(
    [
      [[Key.ArrowUp, Key.ArrowRight], handleIncrement],
      [[Key.ArrowDown, Key.ArrowLeft], handleDecrement],
      [
        Key.Home,
        () => {
          if (minValue !== -Infinity) setValue(minValue);
        },
      ],
      [
        Key.End,
        () => {
          if (maxValue !== Infinity) setValue(maxValue);
        },
      ],
    ],
    {
      disabled: state === 'disabled' || state === 'readOnly',
    },
  );

  const canDecrement =
    value > minValue && state !== 'disabled' && state !== 'readOnly';
  const canIncrement =
    value < maxValue && state !== 'disabled' && state !== 'readOnly';

  const buttonClasses = cx(
    'elevation-none! translate-y-0! rounded-none',
    'bg-input-contrast/5 text-input-contrast',
    'hover:bg-accent hover:text-accent-contrast',
    'disabled:pointer-events-none disabled:opacity-30',
  );

  return (
    <div
      {...restProps}
      role="spinbutton"
      id={id}
      aria-valuenow={value}
      aria-valuemin={minValue !== -Infinity ? minValue : undefined}
      aria-valuemax={maxValue !== Infinity ? maxValue : undefined}
      aria-required={ariaRequired}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      tabIndex={state === 'disabled' ? -1 : 0}
      {...keyboardHandlers}
      className={cx(numberCounterWrapperVariants({ size, state }), className)}
    >
      <IconButton
        size={size}
        color="default"
        disabled={!canDecrement}
        onClick={handleDecrement}
        aria-label={`Decrease by ${step}`}
        tabIndex={-1}
        icon={<Minus />}
        className={buttonClasses}
      />

      <AnimateNumber
        className={numberDisplayVariants({ size })}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
      >
        {value}
      </AnimateNumber>

      <IconButton
        size={size}
        color="default"
        disabled={!canIncrement}
        onClick={handleIncrement}
        aria-label={`Increase by ${step}`}
        tabIndex={-1}
        icon={<Plus />}
        className={buttonClasses}
      />
    </div>
  );
}
