'use client';

import { motion } from 'motion/react';
import { useCallback, useRef } from 'react';

import { RenderMarkdown } from '~/components/RenderMarkdown';
import { headingVariants } from '~/components/typography/Heading';
import {
  controlVariants,
  groupSpacingVariants,
  inputControlVariants,
  smallSizeVariants,
  stateVariants,
  textSizeVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx } from '~/utils/cva';
import { getInputState } from '../../utils/getInputState';
import { type CreateFormFieldProps } from '../Field/types';

type BooleanOption = {
  label: string;
  value: boolean;
};

const optionCardVariants = compose(
  groupSpacingVariants,
  textSizeVariants,
  cva({
    base: cx(
      'grid cursor-pointer grid-cols-[auto_1fr] content-start items-start gap-x-4! gap-y-2!',
      'overflow-hidden rounded border-2 border-current/20',
      'bg-input text-left text-wrap',
      'transition-colors duration-200',
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
    },
  }),
);

const booleanIndicatorVariants = compose(
  smallSizeVariants,
  controlVariants,
  inputControlVariants,
  stateVariants,
  cva({
    base: cx(
      'flex aspect-square shrink-0! items-center justify-center',
      'rounded-full',
      'focusable',
    ),
  }),
);

const selectionSpring = {
  type: 'spring' as const,
  duration: 0.3,
  bounce: 0.15,
};

type BooleanFieldProps = CreateFormFieldProps<
  boolean,
  'fieldset',
  {
    noReset?: boolean;
    label?: string;
    options?: BooleanOption[];
  }
>;

function BooleanIndicator({ isSelected }: { isSelected: boolean }) {
  return (
    <span aria-hidden className={booleanIndicatorVariants()}>
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="text-primary size-full overflow-hidden rounded-full p-[0.1em]"
      >
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          initial={false}
          animate={{ scale: isSelected ? 1 : 0 }}
          transition={{
            type: 'spring',
            bounce: 0.3,
            duration: isSelected ? 0.3 : 0.15,
          }}
        />
      </svg>
    </span>
  );
}

export default function BooleanField(props: BooleanFieldProps) {
  const {
    id,
    className,
    value,
    onChange,
    noReset = true,
    label,
    options = [
      { label: 'Yes', value: true },
      { label: 'No', value: false },
    ],
    disabled,
    readOnly,
    ...rest
  } = props;

  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleSelect = useCallback(
    (optionValue: boolean) => {
      if (readOnly || !onChange) return;
      onChange(optionValue);
    },
    [onChange, readOnly],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      const enabledIndices = options
        .map((_opt, i) => i)
        .filter(() => !disabled);

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
    [options, disabled, handleSelect],
  );

  const groupState = getInputState(props);

  return (
    <div className={cx('flex w-full flex-col gap-2', className)}>
      <fieldset
        id={id}
        {...rest}
        role="radiogroup"
        className="flex w-full items-stretch gap-2 border-0 p-0 *:flex-1"
        disabled={disabled}
        aria-label={label ?? rest['aria-label']}
        aria-invalid={rest['aria-invalid'] ?? undefined}
      >
        {label && <legend className="sr-only">{label}</legend>}
        {options.map((option, index) => {
          const isSelected = value === option.value;
          const optionState = disabled
            ? 'disabled'
            : readOnly
              ? 'readOnly'
              : groupState === 'invalid'
                ? 'invalid'
                : 'normal';

          return (
            <motion.button
              key={String(option.value)}
              ref={(el) => {
                optionRefs.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={
                isSelected || (value === undefined && index === 0) ? 0 : -1
              }
              className={optionCardVariants({
                selected: isSelected,
                state: optionState,
                size: 'md',
              })}
              onClick={() => {
                if (!disabled && !readOnly) {
                  handleSelect(option.value);
                }
              }}
              onKeyDown={(e) => handleKeyDown(e, index)}
              disabled={disabled}
              whileTap={disabled || readOnly ? undefined : { scale: 0.98 }}
              transition={selectionSpring}
            >
              <BooleanIndicator isSelected={isSelected} />
              <span
                className={headingVariants({ level: 'label', margin: 'none' })}
              >
                <RenderMarkdown>{option.label}</RenderMarkdown>
              </span>
            </motion.button>
          );
        })}
      </fieldset>
      {!noReset && value !== undefined && (
        <button
          type="button"
          className="text-sm text-current/60 underline hover:text-current/80"
          onClick={() => onChange?.(undefined)}
          disabled={disabled ?? readOnly}
        >
          Reset answer
        </button>
      )}
    </div>
  );
}
