'use client';

import { Radio } from '@base-ui/react/radio';
import { RadioGroup, type RadioGroupProps } from '@base-ui/react/radio-group';
import { motion } from 'motion/react';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import {
  controlLabelVariants,
  controlVariants,
  groupSpacingVariants,
  inputControlVariants,
  interactiveStateVariants,
  orientationVariants,
  smallSizeVariants,
  stateVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx, type VariantProps } from '~/utils/cva';
import { getInputState } from '../../utils/getInputState';
import { type CreateFormFieldProps } from '../Field/types';

const radioGroupWrapperVariants = compose(
  controlVariants,
  inputControlVariants,
  groupSpacingVariants,
  stateVariants,
  interactiveStateVariants,
  orientationVariants,
  cva({
    base: 'items-start',
  }),
);

const radioOptionVariants = cva({
  base: 'group flex items-center transition-colors duration-200',
  variants: {
    size: {
      sm: 'gap-2 text-sm',
      md: 'gap-3 text-base',
      lg: 'gap-4 text-lg',
      xl: 'gap-5 text-xl',
    },
    disabled: {
      true: 'cursor-not-allowed',
      false: 'cursor-pointer',
    },
  },
  defaultVariants: {
    size: 'md',
    disabled: false,
  },
});

const radioIndicatorVariants = compose(
  smallSizeVariants,
  controlVariants,
  inputControlVariants,
  stateVariants,
  cva({
    base: cx(
      'flex aspect-square shrink-0 items-center justify-center',
      'rounded-[0.15em]',
      'focusable',
    ),
  }),
);

type RadioOption = {
  value: string | number;
  label: string;
  disabled?: boolean;
};

type RadioGroupFieldProps = CreateFormFieldProps<
  string | number,
  'div',
  Omit<RadioGroupProps, 'size' | 'onValueChange' | 'value' | 'defaultValue'> &
    VariantProps<typeof radioGroupWrapperVariants> & {
      options: RadioOption[];
      defaultValue?: string | number;
      orientation?: 'horizontal' | 'vertical';
      size?: 'sm' | 'md' | 'lg' | 'xl';
      useColumns?: boolean;
    }
>;

export default function RadioGroupField(props: RadioGroupFieldProps) {
  const {
    id,
    className,
    name,
    options,
    value,
    defaultValue,
    onChange,
    orientation = 'vertical',
    size = 'md',
    useColumns = false,
    disabled,
    readOnly,
    ...rest
  } = props;

  const handleValueChange = (newValue: unknown) => {
    if (readOnly) return;
    onChange?.(newValue as string | number);
  };

  // Determine if controlled or uncontrolled mode
  // Controlled: onChange prop is provided (form system always uses this pattern)
  // We use onChange as the indicator because the form system may pass undefined
  // value initially while the store is hydrating, but will always provide onChange
  const isControlled = onChange !== undefined;
  // For controlled mode, use empty string as fallback to prevent uncontrolled->controlled switch
  const stringValue = isControlled
    ? value !== undefined
      ? String(value)
      : ''
    : undefined;
  const stringDefaultValue =
    !isControlled && defaultValue !== undefined
      ? String(defaultValue)
      : undefined;

  return (
    <div className="@container w-full">
      <RadioGroup
        id={id}
        name={name}
        {...(isControlled
          ? { value: stringValue }
          : { defaultValue: stringDefaultValue })}
        onValueChange={handleValueChange}
        disabled={disabled}
        readOnly={readOnly}
        className={radioGroupWrapperVariants({
          size,
          orientation,
          useColumns,
          state: getInputState(props),
          className,
        })}
        aria-label={rest['aria-label']}
        aria-describedby={rest['aria-describedby']}
        aria-invalid={rest['aria-invalid'] ?? undefined}
      >
        {options.map((option) => {
          const isOptionDisabled = disabled ?? option.disabled;
          const optionValue = String(option.value);

          const getOptionState = () => {
            if (isOptionDisabled) return 'disabled' as const;
            if (readOnly) return 'readOnly' as const;
            return 'normal' as const;
          };

          return (
            <label
              key={optionValue}
              className={radioOptionVariants({
                size,
                disabled: isOptionDisabled,
              })}
            >
              <Radio.Root
                value={optionValue}
                disabled={isOptionDisabled}
                render={(renderProps, state) => (
                  <div
                    {...renderProps}
                    className={radioIndicatorVariants({
                      size,
                      state: getOptionState(),
                    })}
                  >
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
                        animate={{ scale: state.checked ? 1 : 0 }}
                        transition={{
                          type: 'spring',
                          bounce: 0.3,
                          duration: state.checked ? 0.3 : 0.15,
                        }}
                      />
                    </svg>
                  </div>
                )}
              />
              <span
                className={cx(
                  controlLabelVariants({ size }),
                  'cursor-[inherit] transition-colors duration-200',
                  isOptionDisabled && 'opacity-50',
                )}
              >
                <RenderMarkdown>{option.label}</RenderMarkdown>
              </span>
            </label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
