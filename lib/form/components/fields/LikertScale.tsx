'use client';

import { type HTMLAttributes } from 'react';
import { cx } from '~/utils/cva';

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
  id,
  ...divProps
}: LikertScaleFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = Number(e.target.value);
    const selectedOption = options[index];
    if (selectedOption) {
      onChange?.(selectedOption.value);
    }
  };

  // Find the index of the current value
  const currentIndex = options.findIndex((option) => option.value === value);
  const sliderValue = currentIndex >= 0 ? currentIndex : 0;

  const ticksId = `likert-scale-ticks-${id}`;

  return (
    <div className={cx('w-full', className)} {...divProps}>
      <div className="relative py-4">
        {/* Track container */}
        <div className="relative flex h-10 items-center">
          {/* Slider input with datalist */}
          <input
            type="range"
            min={0}
            max={Math.max(0, options.length - 1)}
            step={1}
            value={sliderValue}
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
              '[&::-moz-range-thumb]:rounded-non',
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
            {options.map((option, index) => (
              <option key={index} value={index} label={option.label}></option>
            ))}
          </datalist>
        </div>

        {/* Labels positioned below ticks */}
        <div className="relative mt-2">
          {options.map((option, index) => {
            const isFirst = index === 0;
            const isLast = index === options.length - 1;
            const percentage = (index / Math.max(1, options.length - 1)) * 100;

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
