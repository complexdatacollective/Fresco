'use client';

import * as Slider from '@radix-ui/react-slider';
import React, { type HTMLAttributes } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
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
  const [showTooltipState, setShowTooltipState] = React.useState(false);

  const handleValueChange = (newValue: number[]) => {
    const index = newValue[0];
    if (index !== undefined) {
      const selectedOption = options[index];
      if (selectedOption) {
        onChange?.(selectedOption.value);
      }
    }
  };

  const handlePointerDown = () => {
    setShowTooltipState(true);
  };

  const handlePointerUp = React.useCallback(() => {
    setShowTooltipState(false);
  }, []);

  React.useEffect(() => {
    document.addEventListener('pointerup', handlePointerUp);
    return () => {
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerUp]);

  // Find the index of the current value
  const currentIndex = options.findIndex((option) => option.value === value);
  const sliderValue = currentIndex >= 0 ? [currentIndex] : [0];
  const currentOption = options[currentIndex] ?? options[0];

  return (
    <div className={cx('w-full', className)} {...divProps}>
      <div className="relative py-4">
        {/* Slider container */}
        <div className="relative flex h-10 items-center">
          <Slider.Root
            className={scaleSliderStyles.root}
            value={sliderValue}
            onValueChange={handleValueChange}
            onPointerDown={handlePointerDown}
            disabled={disabled}
            max={Math.max(0, options.length - 1)}
            min={0}
            step={1}
            aria-valuemin={0}
            aria-valuemax={Math.max(0, options.length - 1)}
            aria-valuenow={currentIndex >= 0 ? currentIndex : undefined}
            aria-valuetext={currentOption?.label ?? ''}
          >
            <Slider.Track className={scaleSliderStyles.track} />

            {/* Tick marks */}
            {options.length > 0 && (
              <div className={scaleSliderStyles.tickContainer}>
                {options.map((_, index) => (
                  <div key={index} className={scaleSliderStyles.tick} />
                ))}
              </div>
            )}

            <TooltipProvider>
              <Tooltip open={showTooltipState}>
                <TooltipTrigger asChild className="pointer-events-none">
                  <Slider.Thumb
                    className={scaleSliderStyles.thumb}
                    aria-label={`Select value on scale: ${currentOption?.label ?? 'No selection'}`}
                    onMouseEnter={() => setShowTooltipState(true)}
                    onMouseLeave={() => setShowTooltipState(false)}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{currentOption?.label ?? currentOption?.value ?? ''}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
