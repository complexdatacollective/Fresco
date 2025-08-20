'use client';

import { type HTMLAttributes } from 'react';
import { cx } from '~/utils/cva';

type VisualAnalogScaleFieldProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange'
> & {
  value?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  minLabel?: string;
  maxLabel?: string;
};

export function VisualAnalogScaleField({
  className,
  value = 0,
  onChange,
  disabled = false,
  min = 0,
  max = 100,
  step = 0.1,
  minLabel,
  maxLabel,
  id,
  ...divProps
}: VisualAnalogScaleFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(Number(e.target.value));
  };

  const ticksId = `analog-scale-ticks-${id}`;

  return (
    <div className={cx('w-full', className)} {...divProps}>
      <div className="relative py-4">
        {/* Track container */}
        <div className="relative flex h-10 items-center">
          {/* Slider input with datalist */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            list={ticksId}
            className={cx(
              'absolute h-2 w-full cursor-pointer appearance-none bg-transparent',
              '[&::-webkit-slider-thumb]:appearance-none',
              '[&::-webkit-slider-thumb]:w-6',
              '[&::-webkit-slider-thumb]:h-6',
              '[&::-webkit-slider-thumb]:rounded-none',
              '[&::-webkit-slider-thumb]:bg-accent',
              '[&::-webkit-slider-thumb]:cursor-pointer',
              '[&::-webkit-slider-thumb]:border-0',
              '[&::-webkit-slider-thumb]:shadow-md',
              '[&::-moz-range-thumb]:w-6',
              '[&::-moz-range-thumb]:h-6',
              '[&::-moz-range-thumb]:rounded-none',
              '[&::-moz-range-thumb]:bg-accent',
              '[&::-moz-range-thumb]:cursor-pointer',
              '[&::-moz-range-thumb]:border-0',
              '[&::-moz-range-thumb]:shadow-md',
              '[&::-moz-range-thumb]:appearance-none',
              '[&::-moz-range-track]:bg-transparent',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          />

          {/* Datalist for tick marks */}
          <datalist id={ticksId}>
            <option value={min} label={minLabel}></option>
            <option value={max} label={maxLabel}></option>
          </datalist>
        </div>

        {/* Labels positioned below ticks */}
        <div className="relative mt-2 flex justify-between">
          {minLabel && (
            <div className="text-muted-foreground max-w-24 text-left text-sm leading-tight">
              {minLabel}
            </div>
          )}
          {maxLabel && (
            <div className="text-muted-foreground max-w-24 text-right text-sm leading-tight">
              {maxLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
