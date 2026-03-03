'use client';

import { useCallback, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import {
  controlVariants,
  inputControlVariants,
  orientationVariants,
  smallSizeVariants,
  stateVariants,
  textSizeVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx, type VariantProps } from '~/utils/cva';
import { getInputState } from '../../utils/getInputState';
import { type CreateFormFieldProps } from '../Field/types';

const richSelectGroupVariants = compose(
  orientationVariants,
  cva({
    base: 'items-stretch',
    variants: {
      size: {
        sm: 'gap-2',
        md: 'gap-2',
        lg: 'gap-3',
        xl: 'gap-4',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }),
);

// Individual option card variants
const optionCardVariants = compose(
  textSizeVariants,
  cva({
    base: cx(
      'grid cursor-pointer grid-cols-[auto_1fr] items-center gap-x-4',
      'overflow-hidden rounded border-2 border-current/20',
      'bg-input text-left text-wrap',
      'px-6 transition-colors duration-200',
      'focusable',
    ),
    variants: {
      selected: {
        true: 'border-primary',
        false: 'hover:border-current/40',
      },
      state: {
        normal: '',
        disabled: 'pointer-events-none cursor-not-allowed opacity-50',
        readOnly: 'pointer-events-none cursor-default',
        invalid: 'border-destructive',
      },
      size: {
        sm: 'py-2',
        md: 'py-3',
        lg: 'py-4',
        xl: 'py-5',
      },
    },
    compoundVariants: [
      {
        selected: true,
        state: 'invalid',
        className: 'border-destructive',
      },
    ],
    defaultVariants: {
      selected: false,
      state: 'normal',
      size: 'md',
    },
  }),
);

const indicatorVariants = compose(
  smallSizeVariants,
  controlVariants,
  inputControlVariants,
  stateVariants,
  cva({
    base: cx(
      'flex aspect-square shrink-0 items-center justify-center',
      'focusable',
    ),
    variants: {
      mode: {
        radio: 'rounded-[0.15em]',
        checkbox: 'rounded-full',
      },
    },
    defaultVariants: {
      mode: 'radio',
    },
  }),
);

const descriptionVariants = cva({
  base: 'col-start-2 leading-snug',
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
              <span
                aria-hidden
                className={indicatorVariants({
                  size,
                  state: optionState,
                  mode: isSingle ? 'radio' : 'checkbox',
                })}
              >
                {isSingle ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="text-primary size-full overflow-hidden rounded-[40%] p-[0.1em]"
                  >
                    <motion.rect
                      x="2"
                      y="2"
                      width="20"
                      height="20"
                      initial={false}
                      animate={{ scale: optionSelected ? 1 : 0 }}
                      transition={{
                        type: 'spring',
                        bounce: 0.3,
                        duration: optionSelected ? 0.3 : 0.15,
                      }}
                    />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-primary size-full p-[0.1em]"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path
                      d="M4 12L10 18L20 6"
                      pathLength={1}
                      style={{
                        strokeDasharray: 1,
                        strokeDashoffset: optionSelected ? 0 : 1,
                        strokeLinecap: optionSelected ? 'round' : 'butt',
                        transition: 'stroke-dashoffset 0.2s ease-out',
                      }}
                    />
                  </svg>
                )}
              </span>
              <span className="min-w-0 leading-tight font-medium">
                <RenderMarkdown>{option.label}</RenderMarkdown>
              </span>
              <span className={descriptionVariants({ size })}>
                <RenderMarkdown>{option.description}</RenderMarkdown>
              </span>
            </motion.button>
          );
        })}
      </fieldset>
    </div>
  );
}
