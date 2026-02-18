'use client';

import { Slider } from '@base-ui/react/slider';
import { motion } from 'motion/react';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import {
  controlLabelVariants,
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
                    if (index === 0 || index === options.length - 1)
                      return null;
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
                render={
                  <motion.div
                    whileTap={{ scale: 1.1 }}
                    transition={{
                      type: 'spring',
                      duration: 0.3,
                      bounce: 0.4,
                    }}
                  />
                }
                className={sliderThumbVariants({ state })}
                aria-label={`Select value on scale: ${currentOption?.label ?? 'No selection'}`}
              />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>

        <div
          className="mt-2 grid gap-2 px-3"
          style={{
            gridTemplateColumns:
              options.length <= 2
                ? `repeat(${options.length}, 1fr)`
                : `0.5fr repeat(${options.length - 2}, 1fr) 0.5fr`,
          }}
        >
          {options.map((option, index) => {
            const isFirst = index === 0;
            const isLast = index === options.length - 1;

            return (
              <div
                key={index}
                className={cx(
                  controlLabelVariants({ size: 'sm' }),
                  options.length === 1
                    ? 'text-center'
                    : isFirst
                      ? 'text-left'
                      : isLast
                        ? 'text-right'
                        : 'text-center',
                )}
              >
                <RenderMarkdown>{option.label}</RenderMarkdown>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
