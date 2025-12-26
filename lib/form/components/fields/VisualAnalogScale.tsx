'use client';

import * as Slider from '@radix-ui/react-slider';
import { type HTMLAttributes } from 'react';
import { scaleSliderStyles } from '~/styles/shared/controlVariants';
import { cx } from '~/utils/cva';
import { type CreateFieldProps } from '../Field/Field';

type VisualAnalogScaleFieldProps = CreateFieldProps<
  Omit<HTMLAttributes<HTMLDivElement>, 'onChange'>
> & {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  minLabel?: string;
  maxLabel?: string;
};

function VisualAnalogScaleField({
  className,
  value = 0,
  onChange,
  min = 0,
  max = 100,
  step = 0.1,
  minLabel,
  maxLabel,
  disabled,
  readOnly,
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
            disabled={disabled ?? readOnly}
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

export { VisualAnalogScaleField };
export default VisualAnalogScaleField;
