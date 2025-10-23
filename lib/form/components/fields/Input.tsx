import { type InputHTMLAttributes, type ReactNode } from 'react';
import { compose, cva, cx, type VariantProps } from '~/utils/cva';
import {
  backgroundStyles,
  borderStyles,
  buildVariantStyles,
  cursorStyles,
  focusRingStyles,
  sizeStyles,
  textStyles,
  transitionStyles,
} from './shared';

// Focus styles for standalone input
export const standaloneFocusStyles = cx(
  focusRingStyles.base,
  focusRingStyles.invalid,
);

// Input element when used with wrapper (prefix/suffix)
export const inputVariants = cva({
  base: cx(
    backgroundStyles.base,
    backgroundStyles.disabled,
    backgroundStyles.readOnly,
    'flex-1 min-w-0 border-0 p-0',
    focusRingStyles.base,
    transitionStyles,
    textStyles.base,
    textStyles.invalid,
    textStyles.disabled,
    textStyles.readOnly,
  ),
  variants: {
    size: {
      sm: cx(sizeStyles.sm.height, sizeStyles.sm.text, sizeStyles.sm.padding),
      md: cx(sizeStyles.md.height, sizeStyles.md.text, sizeStyles.md.padding),
      lg: cx(sizeStyles.lg.height, sizeStyles.lg.text, sizeStyles.lg.padding),
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Wrapper for input with prefix/suffix
export const inputWrapperVariants = compose(
  cva({
    base: cx(
      'group relative inline-flex w-full items-stretch overflow-hidden',
      transitionStyles,
      borderStyles.base,
      borderStyles.invalid,
      backgroundStyles.base,
      backgroundStyles.disabled,
      backgroundStyles.readOnly,
      // Focus styles using :has
      'has-[input:focus]:border-accent/50',
      'has-[input:focus-visible]:outline-none has-[input:focus-visible]:ring-4 has-[input:focus-visible]:ring-accent/10 has-[input:focus-visible]:ring-offset-0',
      'has-[[aria-invalid=true]]:has-[input:focus]:border-destructive',
      'has-[[aria-invalid=true]]:has-[input:focus-visible]:ring-destructive/20',
      // Additional :has selectors for state management
      'has-[[aria-invalid=true]]:border-destructive',
      'has-[input:disabled]:bg-input-placeholder',
      'has-[input:is-read-only]:bg-input-placeholder/50',
    ),
    variants: {
      size: {
        sm: '',
        md: '',
        lg: '',
      },
      variant: {
        default: '',
        ghost: cx(
          'border-transparent bg-transparent',
          'hover:bg-input/50',
          'has-[input:disabled]:bg-transparent has-[input:disabled]:hover:bg-transparent',
        ),
        filled: cx(
          'border-transparent bg-input-placeholder',
          'hover:bg-input-placeholder/80',
          'has-[input:disabled]:bg-input-placeholder has-[input:disabled]:hover:bg-input-placeholder',
        ),
        outline: cx(
          'bg-transparent',
          'hover:bg-input/20',
          'has-[input:disabled]:bg-transparent has-[input:disabled]:hover:bg-transparent',
        ),
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }),
);

// Standalone input (no prefix/suffix)
export const standaloneInputVariants = compose(
  cva({
    base: cx(
      transitionStyles,
      borderStyles.base,
      borderStyles.invalid,
      backgroundStyles.base,
      backgroundStyles.disabled,
      backgroundStyles.readOnly,
      standaloneFocusStyles,
      textStyles.base,
      textStyles.invalid,
      textStyles.disabled,
      textStyles.readOnly,
      cursorStyles.disabled,
      cursorStyles.readOnly,
    ),
    variants: {
      size: {
        sm: cx(sizeStyles.sm.height, sizeStyles.sm.text, sizeStyles.sm.padding),
        md: cx(sizeStyles.md.height, sizeStyles.md.text, sizeStyles.md.padding),
        lg: cx(sizeStyles.lg.height, sizeStyles.lg.text, sizeStyles.lg.padding),
      },
      variant: {
        default: '',
        ghost: buildVariantStyles('ghost'),
        filled: buildVariantStyles('filled'),
        outline: buildVariantStyles('outline'),
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }),
);

// Prefix/suffix styles
export const affixVariants = cva({
  base: cx(
    'flex items-center justify-center shrink-0 grow-0',
    'bg-[currentColor]/50', // Subtle background for affix areas
    'text-(--background)',
  ),
  variants: {
    position: {
      prefix: 'pe-0',
      suffix: 'ps-0',
    },
    size: {
      sm: cx(sizeStyles.sm.text, sizeStyles.sm.padding),
      md: cx(sizeStyles.md.text, sizeStyles.md.padding),
      lg: cx(sizeStyles.lg.text, sizeStyles.lg.padding),
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

type InputType = 'text' | 'number' | 'email' | 'password' | 'search';

// Map input type to its corresponding value type
type InputValueType<T extends InputType> = T extends 'number'
  ? number | undefined
  : string;

type InputFieldProps<T extends InputType = 'text'> = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'type' | 'onChange'
> &
  VariantProps<typeof inputWrapperVariants> & {
    type?: T;
    onChange?: (value: InputValueType<T>) => void;
    // NOTE: these cannot be 'prefix' and 'suffix' because these collide with RDFa attributes in @types/react@18.3.18
    prefixComponent?: ReactNode;
    suffixComponent?: ReactNode;
  };

export function InputField<T extends InputType = 'text'>({
  className,
  size,
  variant,
  prefixComponent: prefix,
  suffixComponent: suffix,
  onChange,
  type = 'text' as T,
  ...inputProps
}: InputFieldProps<T>) {
  // Change handler that coerces the value passed on onChange based on the input type
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    let value: InputValueType<T>;

    switch (type) {
      case 'number':
        // Allow clearing the field - empty string should be undefined, not 0
        value = (
          rawValue === '' ? undefined : Number(rawValue)
        ) as InputValueType<T>;
        break;
      case 'text':
      case 'email':
      case 'password':
      case 'search':
      default:
        value = String(rawValue) as InputValueType<T>;
        break;
    }

    onChange?.(value);
  };

  return (
    <div className={inputWrapperVariants({ size, variant, className })}>
      {prefix && (
        <div className={affixVariants({ size, position: 'prefix' })}>
          {prefix}
        </div>
      )}
      <input
        {...inputProps}
        type={type}
        onChange={handleChange}
        className={inputVariants({ size })}
      />
      {suffix && (
        <div className={affixVariants({ size, position: 'suffix' })}>
          {suffix}
        </div>
      )}
    </div>
  );
}
