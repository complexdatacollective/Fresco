'use client';

import { Slider } from '@base-ui/react/slider';
import { motion } from 'motion/react';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import {
  controlLabelVariants,
  sliderControlVariants,
  sliderRootVariants,
  sliderThumbVariants,
  sliderTrackVariants,
} from '~/styles/shared/controlVariants';
import { cx } from '~/utils/cva';
import { getInputState } from '../../utils/getInputState';
import { type CreateFormFieldProps } from '../Field/types';

type VisualAnalogScaleFieldProps = CreateFormFieldProps<
  number,
  'div',
  {
    min?: number;
    max?: number;
    step?: number;
    minLabel?: string;
    maxLabel?: string;
  }
>;

export default function VisualAnalogScaleField(
  props: VisualAnalogScaleFieldProps,
) {
  const {
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
    ...rest
  } = props;

  const state = getInputState(props);

  const handleValueChange = (newValue: number | number[]) => {
    if (readOnly) return;
    const val = Array.isArray(newValue) ? newValue[0] : newValue;
    if (val !== undefined) {
      onChange?.(val);
    }
  };

  return (
    <div className={cx('w-full', className)} {...rest}>
      <div className="relative py-4">
        <Slider.Root
          value={value}
          onValueChange={handleValueChange}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          aria-invalid={rest['aria-invalid']}
          className={sliderRootVariants({ state })}
        >
          <Slider.Control className={sliderControlVariants()}>
            <Slider.Track className={sliderTrackVariants({ state })}>
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
                aria-label="Visual analog scale value"
              />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>

        {(minLabel ?? maxLabel) && (
          <div className="relative mt-2 flex justify-between px-3">
            {minLabel && (
              <div
                className={cx(
                  controlLabelVariants({ size: 'sm' }),
                  'max-w-24 text-left',
                )}
              >
                <RenderMarkdown>{minLabel}</RenderMarkdown>
              </div>
            )}
            {maxLabel && (
              <div
                className={cx(
                  controlLabelVariants({ size: 'sm' }),
                  'max-w-24 text-right',
                )}
              >
                <RenderMarkdown>{maxLabel}</RenderMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
