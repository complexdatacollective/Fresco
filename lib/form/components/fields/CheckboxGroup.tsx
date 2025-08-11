import { type FieldsetHTMLAttributes } from 'react';
import { Check } from 'lucide-react';
import { cva, cx, type VariantProps } from '~/utils/cva';

// Shared transition styles
const sharedTransitionStyles = cx('transition-all duration-200');

// Fieldset wrapper styles
export const checkboxGroupVariants = cva({
  base: cx(
    'w-full',
    sharedTransitionStyles,
    // Disabled state styles
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ),
  variants: {
    orientation: {
      vertical: 'flex flex-col gap-3',
      horizontal: 'flex flex-row flex-wrap gap-4',
    },
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
  },
  defaultVariants: {
    orientation: 'vertical',
    size: 'md',
  },
});

// Individual checkbox option styles
export const checkboxOptionVariants = cva({
  base: cx(
    'flex items-center gap-3 cursor-pointer group',
    sharedTransitionStyles,
    // Disabled state
    'has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50',
  ),
  variants: {
    size: {
      sm: 'gap-2',
      md: 'gap-3',
      lg: 'gap-3',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Checkbox input styles - matches RadioGroup sizing and colors
export const checkboxInputVariants = cva({
  base: cx(
    'peer shrink-0 rounded border-2 border-border bg-input cursor-pointer',
    'sr-only', // Hide the native checkbox
    sharedTransitionStyles,
  ),
  variants: {
    size: {
      sm: 'w-6 h-6',
      md: 'w-8 h-8',
      lg: 'w-10 h-10',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Visual checkbox container that replaces the native appearance
export const checkboxVisualVariants = cva({
  base: cx(
    'shrink-0 rounded border-2 border-border bg-input cursor-pointer relative',
    'flex items-center justify-center',
    sharedTransitionStyles,
    // Focus styles (when peer input is focused)
    'peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/10 peer-focus:ring-offset-0',
    'peer-focus:border-accent/50',
    // Checked state - matches RadioGroup accent colors
    'peer-checked:border-accent peer-checked:bg-accent',
    // Invalid state - applied via fieldset data attribute
    'group-data-[invalid=true]:border-destructive',
    'group-data-[invalid=true]:peer-focus:border-destructive group-data-[invalid=true]:peer-focus:ring-destructive/20',
    'group-data-[invalid=true]:peer-checked:border-destructive group-data-[invalid=true]:peer-checked:bg-destructive',
    // Disabled state
    'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
    'peer-disabled:peer-checked:bg-muted-foreground peer-disabled:peer-checked:border-muted-foreground',
  ),
  variants: {
    size: {
      sm: 'w-6 h-6',
      md: 'w-8 h-8',
      lg: 'w-10 h-10',
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
    sharedTransitionStyles,
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
    'text-foreground cursor-pointer select-none',
    sharedTransitionStyles,
    // Group states
    'group-has-[input:disabled]:cursor-not-allowed group-has-[input:disabled]:text-muted-foreground',
  ),
  variants: {
    size: {
      sm: 'text-sm leading-5',
      md: 'text-base leading-6',
      lg: 'text-lg leading-7',
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
    name: string;
    options: CheckboxOption[];
    value?: (string | number)[];
    defaultValue?: (string | number)[];
    onChange?: (value: (string | number)[]) => void;
    disabled?: boolean;
    orientation?: 'horizontal' | 'vertical';
    size?: 'sm' | 'md' | 'lg';
  };

export function CheckboxGroupField({
  className,
  name,
  options,
  value,
  defaultValue,
  onChange,
  disabled = false,
  orientation = 'vertical',
  size = 'md',
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
    <fieldset
      {...fieldsetProps}
      className={checkboxGroupVariants({ orientation, size, className })}
      disabled={disabled}
      data-invalid={fieldsetProps['aria-invalid'] === 'true'}
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
              checked={isChecked}
              defaultChecked={
                !isControlled && currentValues.includes(option.value)
              }
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
  );
}
