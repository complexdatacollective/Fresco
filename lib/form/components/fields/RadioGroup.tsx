import { type FieldsetHTMLAttributes } from 'react';
import { cva, cx, type VariantProps } from '~/utils/cva';

// Shared transition styles
const sharedTransitionStyles = cx('transition-all duration-200');

// Fieldset wrapper styles
export const radioGroupVariants = cva({
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

// Individual radio option styles
export const radioOptionVariants = cva({
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

// Radio input styles
export const radioInputVariants = cva({
  base: cx(
    'shrink-0 rounded-full border-2 border-border bg-input cursor-pointer',
    'appearance-none relative',
    sharedTransitionStyles,
    // Focus styles
    'focus:outline-none focus:ring-4 focus:ring-input-foreground/10 focus:ring-offset-0',
    'focus:border-input-foreground/50',
    // Checked state - using background to create the inner circle
    'checked:border-accent checked:bg-input',
    'checked:after:content-[""] checked:after:absolute  checked:after:rounded-full checked:after:bg-accent',
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
      sm: 'w-6 h-6 checked:after:inset-[3px]',
      md: 'w-8 h-8 checked:after:inset-[5px]',
      lg: 'w-10 h-10 checked:after:inset-[7px]',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Radio label text styles
export const radioLabelVariants = cva({
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
    name: string;
    options: RadioOption[];
    value?: string | number;
    defaultValue?: string | number;
    onChange?: (value: string | number) => void;
    disabled?: boolean;
    orientation?: 'horizontal' | 'vertical';
    size?: 'sm' | 'md' | 'lg';
  };

export function RadioGroupField({
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
}: RadioGroupProps) {
  const handleChange = (optionValue: string | number) => {
    if (onChange) {
      onChange(optionValue);
    }
  };

  // Determine if this is controlled or uncontrolled
  const isControlled = value !== undefined;

  return (
    <fieldset
      {...fieldsetProps}
      className={radioGroupVariants({ orientation, size, className })}
      disabled={disabled}
      data-invalid={fieldsetProps['aria-invalid'] === 'true'}
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
              checked={isChecked}
              defaultChecked={!isControlled && defaultValue === option.value}
              disabled={isOptionDisabled}
              onChange={(e) => {
                if (e.target.checked && !isOptionDisabled) {
                  handleChange(option.value);
                }
              }}
              className={radioInputVariants({ size })}
            />
            <span className={radioLabelVariants({ size })}>{option.label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
