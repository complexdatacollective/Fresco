import { type FieldsetHTMLAttributes } from 'react';
import { cva, cx, type VariantProps } from '~/utils/cva';
import {
  borderStyles,
  cursorStyles,
  interactiveElementSizes,
  interactiveElementStyles,
  labelTextStyles,
  opacityStyles,
  sizeStyles,
  transitionStyles,
} from './shared';

// Fieldset wrapper styles
export const radioGroupVariants = cva({
  base: cx(
    'w-full',
    transitionStyles,
    // Disabled state styles
    opacityStyles.disabled,
    cursorStyles.disabled,
    borderStyles.base,
  ),
  variants: {
    orientation: {
      vertical: 'flex flex-col gap-3',
      horizontal: 'flex flex-row flex-wrap gap-4',
    },
    size: {
      sm: cx(sizeStyles.sm.text, sizeStyles.sm.padding),
      md: cx(sizeStyles.md.text, sizeStyles.md.padding),
      lg: cx(sizeStyles.lg.text, sizeStyles.lg.padding),
    },
    useColumns: {
      true: cx(
        'grid gap-3',
        '@xs:grid-cols-1',
        '@sm:grid-cols-2',
        '@md:grid-cols-2',
        '@lg:grid-cols-2',
        '@xl:grid-cols-2',
        '@2xl:grid-cols-3',
        '@3xl:grid-cols-3',
        '@5xl:grid-cols-4',
      ),
      false: '',
    },
  },
  compoundVariants: [
    {
      useColumns: true,
      class: '!flex-none !grid', // Override orientation flex styles when useColumns is enabled
    },
  ],
  defaultVariants: {
    orientation: 'vertical',
    size: 'md',
    useColumns: false,
  },
});

// Individual radio option styles
export const radioOptionVariants = cva({
  base: cx(
    'flex items-center cursor-pointer group',
    transitionStyles,
    // Disabled state
    'has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50',
  ),
  variants: {
    size: {
      sm: sizeStyles.sm.gap,
      md: sizeStyles.md.gap,
      lg: sizeStyles.lg.gap,
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Radio input styles
export const radioInputVariants = cva({
  base: cx(
    interactiveElementStyles.base,
    'rounded-full',
    transitionStyles,
    interactiveElementStyles.focus,
    interactiveElementStyles.focusInvalid,
    // Checked state - using background to create the inner circle
    'checked:border-accent checked:bg-input',
    'checked:after:content-[""] checked:after:absolute checked:after:rounded-full checked:after:bg-accent',
    // Invalid state
    interactiveElementStyles.invalidBorder,
    interactiveElementStyles.checkedInvalid,
    // Disabled state
    cursorStyles.disabled,
    opacityStyles.disabled,
    interactiveElementStyles.checkedDisabled,
  ),
  variants: {
    size: {
      sm: cx(interactiveElementSizes.sm, 'checked:after:inset-[3px]'),
      md: cx(interactiveElementSizes.md, 'checked:after:inset-[5px]'),
      lg: cx(interactiveElementSizes.lg, 'checked:after:inset-[7px]'),
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Radio label text styles
export const radioLabelVariants = cva({
  base: cx(
    labelTextStyles.base,
    transitionStyles,
    cursorStyles.base,
    // Group states
    labelTextStyles.disabled,
  ),
  variants: {
    size: {
      sm: labelTextStyles.size.sm,
      md: labelTextStyles.size.md,
      lg: labelTextStyles.size.lg,
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Export for backward compatibility
export const standaloneFocusStyles = cx(
  interactiveElementStyles.focus,
  interactiveElementStyles.focusInvalid,
);

export type RadioOption = {
  value: string | number;
  label: string;
  disabled?: boolean;
};

type RadioGroupProps = Omit<
  FieldsetHTMLAttributes<HTMLFieldSetElement>,
  'size' | 'onChange'
> &
  VariantProps<typeof radioGroupVariants> & {
    id?: string;
    name: string;
    options: RadioOption[];
    value?: string | number;
    defaultValue?: string | number;
    onChange?: (value: string | number) => void;
    disabled?: boolean;
    orientation?: 'horizontal' | 'vertical';
    size?: 'sm' | 'md' | 'lg';
    useColumns?: boolean;
  };

export function RadioGroupField({
  id,
  className,
  name,
  options,
  value,
  defaultValue,
  onChange,
  disabled = false,
  orientation = 'vertical',
  size = 'md',
  useColumns = false,
  ...fieldsetProps
}: RadioGroupProps) {
  // Generate a default id if none provided
  const fieldId = id ?? `radio-${name}`;
  const handleChange = (optionValue: string | number) => {
    if (onChange) {
      onChange(optionValue);
    }
  };

  // Determine if this is controlled or uncontrolled
  const isControlled = value !== undefined;

  return (
    <div className="@container">
      <fieldset
        {...fieldsetProps}
        className={radioGroupVariants({
          orientation,
          size,
          useColumns,
          className,
        })}
        disabled={disabled}
        data-invalid={fieldsetProps['aria-invalid'] === 'true'}
        aria-labelledby={`${fieldId}-label`} // Important, because we don't have a <legend>
      >
        {options.map((option) => {
          const optionId = `${name}-${option.value}`;
          const isOptionDisabled = disabled || option.disabled;
          const isChecked = isControlled ? value === option.value : undefined; // Let defaultValue handle uncontrolled case

          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={radioOptionVariants({ size })}
            >
              <input
                type="radio"
                id={optionId}
                name={name}
                value={option.value}
                {...(isControlled
                  ? { checked: isChecked }
                  : { defaultChecked: defaultValue === option.value })}
                disabled={isOptionDisabled}
                onChange={(e) => {
                  if (e.target.checked && !isOptionDisabled) {
                    handleChange(option.value);
                  }
                }}
                className={radioInputVariants({ size })}
              />
              <span className={radioLabelVariants({ size })}>
                {option.label}
              </span>
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}
