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
    'flex items-start gap-3 cursor-pointer group relative',
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

// Checkbox input styles
export const checkboxInputVariants = cva({
  base: cx(
    'shrink-0 rounded border-2 border-border bg-input cursor-pointer',
    'appearance-none relative',
    sharedTransitionStyles,
    // Focus styles
    'focus:outline-none focus:ring-4 focus:ring-input-foreground/10 focus:ring-offset-0',
    'focus:border-input-foreground/50',
    // Checked state
    'checked:border-primary checked:bg-primary',
    // Invalid state - applied via fieldset data attribute
    'group-data-[invalid=true]:border-destructive',
    'group-data-[invalid=true]:focus:border-destructive group-data-[invalid=true]:focus:ring-destructive/20',
    'group-data-[invalid=true]:checked:border-destructive group-data-[invalid=true]:checked:bg-destructive',
    // Disabled state
    'disabled:cursor-not-allowed disabled:opacity-50',
    'disabled:checked:bg-muted-foreground disabled:checked:border-muted-foreground',
  ),
  variants: {
    size: {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Checkbox check icon styles
export const checkboxIconVariants = cva({
  base: cx(
    'absolute inset-0 flex items-center justify-center text-primary-foreground',
    'opacity-0 scale-0',
    sharedTransitionStyles,
    // Show when checked
    'peer-checked:opacity-100 peer-checked:scale-100',
    // Disabled state
    'peer-disabled:text-muted-foreground',
  ),
  variants: {
    size: {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
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
            <div className="relative">
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
                className={cx(checkboxInputVariants({ size }), 'peer')}
              />
              <div className={checkboxIconVariants({ size })}>
                <Check
                  className={cx(
                    size === 'sm' && 'h-3 w-3',
                    size === 'md' && 'h-4 w-4',
                    size === 'lg' && 'h-5 w-5',
                  )}
                />
              </div>
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
