'use client';

import { useCallback, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import {
  controlVariants,
  groupSpacingVariants,
  inputControlVariants,
  interactiveStateVariants,
  orientationVariants,
  stateVariants,
  textSizeVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx, type VariantProps } from '~/utils/cva';
import { getInputState } from '../../utils/getInputState';
import { type CreateFormFieldProps } from '../Field/types';

// Wrapper variants for the fieldset container
const richSelectGroupVariants = compose(
  controlVariants,
  inputControlVariants,
  groupSpacingVariants,
  stateVariants,
  interactiveStateVariants,
  orientationVariants,
  cva({
    base: 'items-stretch',
  }),
);

// Individual option card variants
const optionCardVariants = compose(
  textSizeVariants,
  cva({
    base: cx(
      'relative flex cursor-pointer flex-col items-start gap-1',
      'rounded border-2 border-current/20',
      'bg-transparent text-left',
      'transition-all duration-200',
      'focusable',
    ),
    variants: {
      selected: {
        true: cx(
          'border-primary bg-primary/5',
          'ring-primary ring-2 ring-offset-2',
        ),
        false: cx('hover:border-current/40 hover:bg-current/5'),
      },
      state: {
        normal: '',
        disabled: 'pointer-events-none cursor-not-allowed opacity-50',
        readOnly: 'pointer-events-none cursor-default',
        invalid: 'border-destructive',
      },
      size: {
        sm: 'px-3 py-2',
        md: 'px-4 py-3',
        lg: 'px-5 py-4',
        xl: 'px-6 py-5',
      },
    },
    compoundVariants: [
      {
        selected: true,
        state: 'invalid',
        className: 'border-destructive ring-destructive',
      },
    ],
    defaultVariants: {
      selected: false,
      state: 'normal',
      size: 'md',
    },
  }),
);

// Description text variants
const descriptionVariants = cva({
  base: cx('leading-snug text-current/60'),
  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
      xl: 'text-lg',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Spring animation for selection ring
const selectionSpring = {
  type: 'spring' as const,
  duration: 0.3,
  bounce: 0.15,
};

export type RichSelectOption = {
  value: string | number;
  label: string;
  description: string;
  disabled?: boolean;
};

type RichSelectGroupProps = CreateFormFieldProps<
  string | number | (string | number)[],
  'fieldset',
  {
    options: RichSelectOption[];
    multiple?: boolean;
    defaultValue?: string | number | (string | number)[];
    orientation?: 'horizontal' | 'vertical';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    useColumns?: boolean;
  }
> &
  VariantProps<typeof richSelectGroupVariants>;

export default function RichSelectGroupField(props: RichSelectGroupProps) {
  const {
    id,
    className,
    options = [],
    value,
    defaultValue,
    onChange,
    multiple = false,
    orientation = 'vertical',
    size = 'md',
    useColumns = false,
    disabled,
    readOnly,
    ...fieldsetProps
  } = props;

  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const isControlled = onChange !== undefined;

  const currentValue = useMemo(
    () =>
      isControlled ? value : (defaultValue ?? (multiple ? [] : undefined)),
    [isControlled, value, defaultValue, multiple],
  );

  const isSelected = useCallback(
    (optionValue: string | number) => {
      if (multiple && Array.isArray(currentValue)) {
        return currentValue.includes(optionValue);
      }
      return currentValue === optionValue;
    },
    [currentValue, multiple],
  );

  const handleSelect = useCallback(
    (optionValue: string | number) => {
      if (readOnly || !onChange) return;

      if (multiple) {
        const arr = Array.isArray(value) ? value : [];
        const isAlreadySelected = arr.includes(optionValue);
        const newValues = isAlreadySelected
          ? arr.filter((v) => v !== optionValue)
          : [...arr, optionValue];
        onChange(newValues);
      } else {
        onChange(optionValue);
      }
    },
    [multiple, onChange, readOnly, value],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (multiple) return;

      const enabledIndices = options
        .map((opt, i) => ({ disabled: disabled ?? opt.disabled, index: i }))
        .filter((opt) => !opt.disabled)
        .map((opt) => opt.index);

      const currentEnabledIndex = enabledIndices.indexOf(index);
      if (currentEnabledIndex === -1) return;

      let nextIndex: number | undefined;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const next = currentEnabledIndex + 1;
        nextIndex = enabledIndices[next >= enabledIndices.length ? 0 : next];
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = currentEnabledIndex - 1;
        nextIndex = enabledIndices[prev < 0 ? enabledIndices.length - 1 : prev];
      }

      if (nextIndex !== undefined) {
        optionRefs.current[nextIndex]?.focus();
        const option = options[nextIndex];
        if (option) {
          handleSelect(option.value);
        }
      }
    },
    [multiple, options, disabled, handleSelect],
  );

  const groupState = getInputState(props);
  const isSingle = !multiple;

  return (
    <div className="@container w-full">
      <fieldset
        id={id}
        {...fieldsetProps}
        role={isSingle ? 'radiogroup' : 'group'}
        className={richSelectGroupVariants({
          size,
          orientation,
          useColumns,
          state: groupState,
          className,
        })}
        disabled={disabled}
        aria-label={fieldsetProps['aria-label']}
        aria-labelledby={fieldsetProps['aria-labelledby']}
        aria-describedby={fieldsetProps['aria-describedby']}
        aria-invalid={fieldsetProps['aria-invalid'] ?? undefined}
      >
        {options.map((option, index) => {
          const isOptionDisabled = disabled ?? option.disabled;
          const optionSelected = isSelected(option.value);
          const optionState = isOptionDisabled
            ? 'disabled'
            : readOnly
              ? 'readOnly'
              : groupState === 'invalid'
                ? 'invalid'
                : 'normal';

          const ariaProps = isSingle
            ? {
                'role': 'radio' as const,
                'aria-checked': optionSelected,
                'tabIndex':
                  optionSelected || (!currentValue && index === 0) ? 0 : -1,
              }
            : {
                'aria-pressed': optionSelected,
                'tabIndex': 0,
              };

          return (
            <motion.button
              key={String(option.value)}
              ref={(el) => {
                optionRefs.current[index] = el;
              }}
              type="button"
              className={optionCardVariants({
                selected: optionSelected,
                state: optionState,
                size,
              })}
              onClick={() => {
                if (!isOptionDisabled && !readOnly) {
                  handleSelect(option.value);
                }
              }}
              onKeyDown={(e) => handleKeyDown(e, index)}
              disabled={isOptionDisabled}
              whileTap={
                isOptionDisabled || readOnly ? undefined : { scale: 0.98 }
              }
              transition={selectionSpring}
              {...ariaProps}
            >
              <span className="leading-tight font-medium">
                <RenderMarkdown>{option.label}</RenderMarkdown>
              </span>
              <span className={descriptionVariants({ size })}>
                <RenderMarkdown>{option.description}</RenderMarkdown>
              </span>
              <AnimatePresence>
                {optionSelected && (
                  <motion.span
                    className="bg-primary/10 absolute inset-0 rounded"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    aria-hidden
                  />
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </fieldset>
    </div>
  );
}
