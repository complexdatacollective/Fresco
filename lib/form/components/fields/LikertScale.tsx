'use client';

import * as Slider from '@radix-ui/react-slider';
import { type HTMLAttributes } from 'react';
import { cx } from '~/utils/cva';
import { scaleSliderStyles } from './shared';

type Option = {
  label: string;
  value: string | number;
};

type LikertScaleFieldProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange'
> & {
  value?: string | number;
  onChange?: (value: string | number) => void;
  disabled?: boolean;
  options?: Option[];
};

export function LikertScaleField({
  className,
  value,
  onChange,
  disabled = false,
  options = [],
  id: _id,
  ...divProps
}: LikertScaleFieldProps) {
  const handleValueChange = (newValue: number[]) => {
    const index = newValue[0];
    if (index !== undefined) {
      const selectedOption = options[index];
      if (selectedOption) {
        onChange?.(selectedOption.value);
      }
    }
  };

  // Find the index of the current value
  const currentIndex = options.findIndex((option) => option.value === value);
  const sliderValue = currentIndex >= 0 ? [currentIndex] : [0];

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
            max={Math.max(0, options.length - 1)}
            min={0}
            step={1}
          >
            <Slider.Track className={scaleSliderStyles.track} />

            {/* Tick marks */}
            {options.length > 0 && (
              <div className="absolute inset-0 flex w-full grow items-center justify-between px-[10px]">
                {options.map((_, index) => (
                  <div key={index} className="bg-border h-3 w-1 rounded-full" />
                ))}
              </div>
            )}

            <Slider.Thumb
              className={scaleSliderStyles.thumb}
              aria-label="Likert scale value"
            />
          </Slider.Root>
        </div>

        {/* Labels positioned below ticks */}
        <div className="relative mt-2">
          {options.map((option, index) => {
            const isFirst = index === 0;
            const isLast = index === options.length - 1;
            const percentage =
              options.length > 1
                ? (index / Math.max(1, options.length - 1)) * 100
                : 50;

            return (
              <div
                key={index}
                className={cx(
                  'text-muted-foreground absolute max-w-20 text-sm leading-tight',
                  isFirst ? 'text-left' : isLast ? 'text-right' : 'text-center',
                )}
                style={{
                  left: `${percentage}%`,
                  transform: isFirst
                    ? 'translateX(0)'
                    : isLast
                      ? 'translateX(-100%)'
                      : 'translateX(-50%)',
                }}
              >
                {option.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
