'use client';

import { Slider } from '@base-ui/react/slider';
import {
  sliderControlVariants,
  sliderRootVariants,
  sliderThumbVariants,
  sliderTickContainerStyles,
  sliderTickStyles,
  sliderTrackVariants,
} from '~/styles/shared/controlVariants';
import { cx } from '~/utils/cva';
import { getInputState } from '../../utils/getInputState';
import { type CreateFormFieldProps } from '../Field/types';

type Option = {
  label: string;
  value: string | number;
};

type LikertScaleFieldProps = CreateFormFieldProps<
  string | number,
  'div',
  {
    options?: Option[];
  }
>;

export default function LikertScaleField(props: LikertScaleFieldProps) {
  const {
    className,
    value,
    onChange,
    options = [],
    disabled,
    readOnly,
    ...rest
  } = props;

  const state = getInputState(props);

  const handleValueChange = (newValue: number | number[]) => {
    if (readOnly) return;
    const index = Array.isArray(newValue) ? newValue[0] : newValue;
    if (index !== undefined) {
      const selectedOption = options[index];
      if (selectedOption) {
        onChange?.(selectedOption.value);
      }
    }
  };

  const currentIndex = options.findIndex((option) => option.value === value);
  const sliderValue = currentIndex >= 0 ? currentIndex : 0;
  const currentOption = options[currentIndex] ?? options[0];

  return (
    <div className={cx('w-full', className)} {...rest}>
      <div className="relative py-4">
        <Slider.Root
          value={sliderValue}
          onValueChange={handleValueChange}
          disabled={disabled}
          min={0}
          max={Math.max(0, options.length - 1)}
          step={1}
          aria-invalid={rest['aria-invalid']}
          className={sliderRootVariants({ state })}
        >
          <Slider.Control className={sliderControlVariants()}>
            <Slider.Track className={sliderTrackVariants({ state })}>
              {options.length > 0 && (
                <div className={sliderTickContainerStyles}>
                  {options.map((_, index) => {
                    const percentage =
                      options.length > 1
                        ? (index / (options.length - 1)) * 100
                        : 50;
                    return (
                      <div
                        key={index}
                        className={cx(
                          sliderTickStyles,
                          'absolute -translate-x-1/2',
                        )}
                        style={{ left: `${percentage}%` }}
                      />
                    );
                  })}
                </div>
              )}
              <Slider.Thumb
                className={sliderThumbVariants({ state })}
                aria-label={`Select value on scale: ${currentOption?.label ?? 'No selection'}`}
              />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>

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
                  'absolute max-w-20 text-sm leading-tight text-current/70',
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
