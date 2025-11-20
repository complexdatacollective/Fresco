'use client';

import * as Slider from '@radix-ui/react-slider';
import { type HTMLAttributes } from 'react';
import { cx } from '~/utils/cva';
import { scaleSliderStyles } from './shared';

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
  id: _id,
  ...divProps
}: VisualAnalogScaleFieldProps) {
  const handleValueChange = (newValue: number[]) => {
    const value = newValue[0];
    if (value !== undefined) {
      onChange?.(value);
    }
  };

  const sliderValue = [value];

  return (
    <div className={cx('w-full', className)} {...divProps}>
      <div className="relative py-4">
        {/* Slider container */}
        <div className="relative flex h-10 items-center">
          <Slider.Root
            className={scaleSliderStyles.root}
            value={sliderValue}
            onValueChange={handleValueChange}
            disabled={disabled}
            max={max}
            min={min}
            step={step}
          >
            <Slider.Track className={scaleSliderStyles.track} />
            <Slider.Thumb
              className={scaleSliderStyles.thumb}
              aria-label="Visual analog scale value"
            />
          </Slider.Root>
        </div>

        {/* Labels positioned below slider */}
        <div className="relative mt-2 flex justify-between">
          {minLabel && (
            <div className="max-w-24 text-left text-sm leading-tight text-current/70">
              {minLabel}
            </div>
          )}
          {maxLabel && (
            <div className="max-w-24 text-right text-sm leading-tight text-current/70">
              {maxLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
