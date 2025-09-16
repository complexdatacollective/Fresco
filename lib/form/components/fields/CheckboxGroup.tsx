import { Check } from 'lucide-react';
import { type FieldsetHTMLAttributes } from 'react';
import { cva, cx, type VariantProps } from '~/utils/cva';
import {
  cursorStyles,
  interactiveElementSizes,
  interactiveElementStyles,
  labelTextStyles,
  opacityStyles,
  sizeStyles,
  transitionStyles,
} from './shared';

// Fieldset wrapper styles
export const checkboxGroupVariants = cva({
  base: cx(
    'w-full',
    transitionStyles,
    // Disabled state styles
    opacityStyles.disabled,
    cursorStyles.disabled,
  ),
  variants: {
    orientation: {
      vertical: 'flex flex-col gap-3',
      horizontal: 'flex flex-row flex-wrap gap-4',
    },
    size: {
      sm: sizeStyles.sm.text,
      md: sizeStyles.md.text,
      lg: sizeStyles.lg.text,
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

// Individual checkbox option styles
export const checkboxOptionVariants = cva({
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

// Checkbox input styles - hidden but still accessible
export const checkboxInputVariants = cva({
  base: cx(
    'peer sr-only', // Hide the native checkbox
    transitionStyles,
  ),
  variants: {
    size: {
      sm: interactiveElementSizes.sm,
      md: interactiveElementSizes.md,
      lg: interactiveElementSizes.lg,
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Visual checkbox container that replaces the native appearance
export const checkboxVisualVariants = cva({
  base: cx(
    interactiveElementStyles.base,
    'rounded relative',
    'flex items-center justify-center',
    transitionStyles,
    // Focus styles (when peer input is focused)
    'peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/10 peer-focus:ring-offset-0',
    'peer-focus:border-accent/50',
    // Checked state - matches RadioGroup accent colors
    'peer-checked:border-accent peer-checked:bg-accent',
    // Invalid state
    interactiveElementStyles.invalidBorder,
    'group-data-[invalid=true]:peer-focus:border-destructive group-data-[invalid=true]:peer-focus:ring-destructive/20',
    'group-data-[invalid=true]:peer-checked:border-destructive group-data-[invalid=true]:peer-checked:bg-destructive',
    // Disabled state
    'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
    'peer-disabled:peer-checked:bg-muted-foreground peer-disabled:peer-checked:border-muted-foreground',
  ),
  variants: {
    size: {
      sm: interactiveElementSizes.sm,
      md: interactiveElementSizes.md,
      lg: interactiveElementSizes.lg,
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Checkbox check icon styles
export const checkboxIconVariants = cva({
  base: cx(
    'text-accent-foreground pointer-events-none',
    'opacity-0 scale-0',
    transitionStyles,
    // Show when checked
    'peer-checked:opacity-100 peer-checked:scale-100',
    // Disabled state
    'peer-disabled:text-muted-foreground',
  ),
  variants: {
    size: {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Checkbox label text styles
export const checkboxLabelVariants = cva({
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

export type CheckboxOption = {
  value: string | number;
  label: string;
  disabled?: boolean;
};

type CheckboxGroupProps = Omit<
  FieldsetHTMLAttributes<HTMLFieldSetElement>,
  'size' | 'onChange'
> &
  VariantProps<typeof checkboxGroupVariants> & {
    id?: string;
    name: string;
    options: CheckboxOption[];
    value?: (string | number)[];
    defaultValue?: (string | number)[];
    onChange?: (value: (string | number)[]) => void;
    disabled?: boolean;
    orientation?: 'horizontal' | 'vertical';
    size?: 'sm' | 'md' | 'lg';
    useColumns?: boolean;
  };

export function CheckboxGroupField({
  id: _id,
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
}: CheckboxGroupProps) {
  const handleChange = (optionValue: string | number, checked: boolean) => {
    if (onChange) {
      const currentValues = value ?? [];
      const newValues = checked
        ? [...currentValues, optionValue]
        : currentValues.filter((v) => v !== optionValue);
      onChange(newValues);
    }
  };

  // Determine if this is controlled or uncontrolled
  const isControlled = value !== undefined;
  const currentValues = isControlled ? value : (defaultValue ?? []);

  return (
    <div className="@container">
      <fieldset
        {...fieldsetProps}
        className={checkboxGroupVariants({
          orientation,
          size,
          useColumns,
          className,
        })}
        disabled={disabled}
        data-invalid={fieldsetProps['aria-invalid'] === 'true'}
        {...(fieldsetProps['aria-labelledby']
          ? { 'aria-labelledby': fieldsetProps['aria-labelledby'] }
          : {})}
        {...(fieldsetProps['aria-label']
          ? { 'aria-label': fieldsetProps['aria-label'] }
          : {})}
      >
        {options.map((option) => {
          const optionId = `${name}-${option.value}`;
          const isOptionDisabled = disabled || option.disabled;
          const isChecked = isControlled
            ? currentValues.includes(option.value)
            : undefined; // Let defaultValue handle uncontrolled case

          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={checkboxOptionVariants({ size })}
            >
              <input
                type="checkbox"
                id={optionId}
                name={name}
                value={option.value}
                {...(isControlled
                  ? { checked: isChecked }
                  : { defaultChecked: currentValues.includes(option.value) })}
                disabled={isOptionDisabled}
                onChange={(e) => {
                  if (!isOptionDisabled) {
                    handleChange(option.value, e.target.checked);
                  }
                }}
                className={checkboxInputVariants({ size })}
              />
              <div className={checkboxVisualVariants({ size })}>
                <Check className={checkboxIconVariants({ size })} />
              </div>
              <span className={checkboxLabelVariants({ size })}>
                {option.label}
              </span>
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}
