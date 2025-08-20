'use client';

import { type InputHTMLAttributes } from 'react';
import { cx } from '~/utils/cva';
import { cursorStyles, focusRingStyles, transitionStyles } from './shared';

const sliderStyles = cx(
  'w-full h-2 rounded-lg appearance-none cursor-pointer',
  'bg-input border border-border',
  transitionStyles,
  focusRingStyles.base,
  cursorStyles.disabled,
  'disabled:opacity-50',
  // Webkit thumb styles
  '[&::-webkit-slider-thumb]:appearance-none',
  '[&::-webkit-slider-thumb]:h-5',
  '[&::-webkit-slider-thumb]:w-5',
  '[&::-webkit-slider-thumb]:rounded-full',
  '[&::-webkit-slider-thumb]:bg-accent',
  '[&::-webkit-slider-thumb]:cursor-pointer',
  '[&::-webkit-slider-thumb]:border-2',
  '[&::-webkit-slider-thumb]:border-background',
  '[&::-webkit-slider-thumb]:shadow-sm',
  // Firefox thumb styles
  '[&::-moz-range-thumb]:h-5',
  '[&::-moz-range-thumb]:w-5',
  '[&::-moz-range-thumb]:rounded-full',
  '[&::-moz-range-thumb]:bg-accent',
  '[&::-moz-range-thumb]:cursor-pointer',
  '[&::-moz-range-thumb]:border-2',
  '[&::-moz-range-thumb]:border-background',
  '[&::-moz-range-thumb]:shadow-sm',
  '[&::-moz-range-thumb]:appearance-none',
  // Firefox track styles
  '[&::-moz-range-track]:bg-input',
  '[&::-moz-range-track]:border',
  '[&::-moz-range-track]:border-border',
  '[&::-moz-range-track]:rounded-lg',
  '[&::-moz-range-track]:h-2',
);

type SliderFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  min?: number;
  max?: number;
  step?: number;
};

export function SliderField({
  className,
  min = 0,
  max = 100,
  step = 1,
  ...inputProps
}: SliderFieldProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      className={cx(sliderStyles, className)}
      {...inputProps}
    />
  );
}
