'use client';

import * as Checkbox from '@radix-ui/react-checkbox';
import { AnimatePresence, motion } from 'motion/react';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import {
  controlVariants,
  groupSpacingVariants,
  inputControlVariants,
  interactiveStateVariants,
  stateVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx, type VariantProps } from '~/utils/cva';
import { getInputState } from '../../utils/getInputState';
import { type CreateFormFieldProps } from '../Field/types';

// Compose fieldset wrapper variants
const toggleButtonGroupComposedVariants = compose(
  controlVariants,
  inputControlVariants,
  groupSpacingVariants,
  stateVariants,
  interactiveStateVariants,
  cva({
    base: 'w-full flex-wrap items-start justify-center',
  }),
);

// Individual toggle button variants
const toggleButtonVariants = cva({
  base: cx(
    'relative inline-flex items-center justify-center',
    'shrink-0 cursor-pointer rounded-full',
    'overflow-hidden text-center font-medium',
    'border-4 bg-transparent',
    'focusable',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'elevation-low',
  ),
  variants: {
    selected: {
      true: 'text-white',
      false: 'text-current',
    },
    catColor: {
      1: 'border-cat-1 focus-visible:outline-cat-1',
      2: 'border-cat-2 focus-visible:outline-cat-2',
      3: 'border-cat-3 focus-visible:outline-cat-3',
      4: 'border-cat-4 focus-visible:outline-cat-4',
      5: 'border-cat-5 focus-visible:outline-cat-5',
      6: 'border-cat-6 focus-visible:outline-cat-6',
      7: 'border-cat-7 focus-visible:outline-cat-7',
      8: 'border-cat-8 focus-visible:outline-cat-8',
      9: 'border-cat-9 focus-visible:outline-cat-9',
      10: 'border-cat-10 focus-visible:outline-cat-10',
    },
    size: {
      sm: 'h-24 w-24 p-2 text-xs',
      md: 'h-36 w-36 p-3 text-sm',
      lg: 'h-48 w-48 p-4 text-base',
      xl: 'h-60 w-60 p-5 text-lg',
    },
  },
  defaultVariants: {
    selected: false,
    catColor: 1,
    size: 'md',
  },
});

// Fill indicator variants for the animated background
const fillIndicatorVariants = cva({
  base: 'absolute inset-1 rounded-full',
  variants: {
    catColor: {
      1: 'bg-cat-1',
      2: 'bg-cat-2',
      3: 'bg-cat-3',
      4: 'bg-cat-4',
      5: 'bg-cat-5',
      6: 'bg-cat-6',
      7: 'bg-cat-7',
      8: 'bg-cat-8',
      9: 'bg-cat-9',
      10: 'bg-cat-10',
    },
  },
  defaultVariants: {
    catColor: 1,
  },
});

// Spring animation config for selection
const selectionSpring = {
  type: 'spring' as const,
  duration: 0.4,
  bounce: 0.25,
};

type ToggleButtonOption = {
  value: string | number;
  label: string;
  disabled?: boolean;
};

type ToggleButtonGroupProps = CreateFormFieldProps<
  (string | number)[],
  'fieldset',
  {
    options: ToggleButtonOption[];
    defaultValue?: (string | number)[];
    orientation?: 'horizontal' | 'vertical';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    useColumns?: boolean;
  }
> &
  VariantProps<typeof toggleButtonGroupComposedVariants>;

export default function ToggleButtonGroupField(props: ToggleButtonGroupProps) {
  const {
    id,
    className,
    name,
    options = [],
    value,
    defaultValue,
    onChange,
    size = 'md',
    disabled,
    readOnly,
    ...fieldsetProps
  } = props;

  const handleToggleOption = (optionValue: string | number) => {
    if (readOnly) return;
    if (onChange) {
      const currentValues = value ?? [];
      const isSelected = currentValues.includes(optionValue);
      const newValues = isSelected
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues);
    }
  };

  // Determine if this is controlled or uncontrolled
  const isControlled = value !== undefined;
  const currentValues = isControlled ? value : (defaultValue ?? []);

  const getCatColorIndex = (index: number) => {
    return ((index % 10) + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  };

  return (
    <fieldset
      id={id}
      {...fieldsetProps}
      className={toggleButtonGroupComposedVariants({
        state: getInputState(props),
        className,
      })}
      disabled={disabled}
      {...(fieldsetProps['aria-labelledby']
        ? { 'aria-labelledby': fieldsetProps['aria-labelledby'] }
        : {})}
      {...(fieldsetProps['aria-label']
        ? { 'aria-label': fieldsetProps['aria-label'] }
        : {})}
    >
      {options.map((option, index) => {
        const isOptionDisabled = disabled ?? option.disabled;
        const isChecked = currentValues.includes(option.value);
        const catColor = getCatColorIndex(index);

        return (
          <Checkbox.Root
            key={String(option.value)}
            name={name}
            value={String(option.value)}
            checked={isChecked}
            onCheckedChange={() => {
              if (!isOptionDisabled && !readOnly) {
                handleToggleOption(option.value);
              }
            }}
            disabled={isOptionDisabled}
            asChild
          >
            <motion.button
              className={toggleButtonVariants({
                selected: isChecked,
                catColor,
                size,
              })}
              whileTap={isOptionDisabled ? undefined : { scale: 0.95 }}
              transition={selectionSpring}
            >
              <AnimatePresence initial={false} mode="wait">
                {isChecked && (
                  <motion.div
                    key={`fill-${option.value}`}
                    className={fillIndicatorVariants({ catColor })}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={selectionSpring}
                  />
                )}
              </AnimatePresence>
              <span className="relative z-10 line-clamp-3 max-w-full overflow-hidden leading-tight text-balance">
                <RenderMarkdown>{option.label}</RenderMarkdown>
              </span>
            </motion.button>
          </Checkbox.Root>
        );
      })}
    </fieldset>
  );
}
