'use client';

import * as Slider from '@radix-ui/react-slider';
import { type InputHTMLAttributes } from 'react';
import { cx } from '~/utils/cva';

const sliderRootStyles = cx(
  'relative flex w-full touch-none select-none items-center',
  'data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed'
);

const sliderTrackStyles = cx(
  'relative h-2 w-full grow overflow-hidden rounded-full bg-input border border-border'
);

const sliderRangeStyles = cx(
  'absolute h-full bg-accent'
);

const sliderThumbStyles = cx(
  'block h-5 w-5 rounded-full border-2 border-background bg-accent shadow-sm transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20',
  'disabled:pointer-events-none disabled:opacity-50'
);

type SliderFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> & {
  min?: number;
  max?: number;
  step?: number;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export function SliderField({
  className,
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  disabled,
  ...inputProps
}: SliderFieldProps) {
  const handleValueChange = (newValue: number[]) => {
    onChange?.({
      target: { value: String(newValue[0]) }
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const sliderValue = value ? [Number(value)] : undefined;

  return (
    <Slider.Root
      className={cx(sliderRootStyles, className)}
      value={sliderValue}
      onValueChange={handleValueChange}
      disabled={disabled}
      max={max}
      min={min}
      step={step}
    >
      <Slider.Track className={sliderTrackStyles}>
        <Slider.Range className={sliderRangeStyles} />
      </Slider.Track>
      <Slider.Thumb 
        className={sliderThumbStyles}
        aria-label="Slider value"
      />
      {/* Hidden input for form compatibility */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-hidden="true"
        tabIndex={-1}
        style={{
          position: 'absolute',
          pointerEvents: 'none',
          opacity: 0,
          margin: 0,
        }}
        {...inputProps}
      />
    </Slider.Root>
  );
}
