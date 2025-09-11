import { Loader2 } from 'lucide-react';
import type dynamicIconImports from 'lucide-react/dynamicIconImports';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import DynamicLucideIcon from '~/components/DynamicLucideIcon';
import { cva, cx, type VariantProps } from '~/utils/cva';

type LucideIcon = keyof typeof dynamicIconImports;

const buttonVariants = cva({
  base: [
    // Core button styles
    'inline-flex items-center justify-center focusable cursor-pointer shadow-lg',
    'font-bold text-xs tracking-wider uppercase',
    'text-center',
    'min-h-14 px-12',
    'rounded-[2rem] mb-[0.15rem]',
    'transition-all duration-200',
    // Default color
    'bg-sea-green text-white',
    // Disabled state
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ],
  variants: {
    color: {
      'default': 'bg-sea-green text-white hover:bg-sea-green-dark',
      'primary': 'bg-primary text-primary-foreground hover:bg-primary',
      'secondary': 'bg-secondary text-secondary-foreground hover:bg-secondary',
      'destructive':
        'bg-destructive text-destructive-foreground hover:bg-destructive',
      'success': 'bg-success text-success-foreground hover:bg-success',
      'warning': 'bg-warning text-warning-foreground hover:bg-warning',
      'info': 'bg-info text-info-foreground hover:bg-info',
      'white': 'bg-white text-charcoal hover:bg-white',
      'platinum': 'bg-platinum text-charcoal hover:bg-platinum-dark',
      'platinum-dark': 'bg-platinum-dark text-charcoal hover:bg-platinum-dark',
      'sea-green': 'bg-sea-green text-white hover:bg-sea-green-dark',
      'mustard': 'bg-mustard text-white hover:bg-mustard-dark',
      'neon-coral': 'bg-neon-coral text-white hover:bg-neon-coral-dark',
      'slate-blue': 'bg-slate-blue text-white hover:bg-slate-blue-dark',
      'cyber-grape': 'bg-cyber-grape text-white hover:bg-cyber-grape-dark',
    },
    size: {
      default: 'text-sm',
      small: 'min-h-10 text-xs px-6',
    },
    iconPosition: {
      left: 'flex-row-reverse gap-2',
      right: 'flex-row gap-2',
    },
    loading: {
      true: 'pointer-events-none',
      false: '',
    },
  },
  compoundVariants: [],
  defaultVariants: {
    color: 'default',
    size: 'default',
    iconPosition: 'left',
    loading: false,
  },
});

export type ButtonProps = {
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> &
  VariantProps<typeof buttonVariants>;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      color,
      size,
      children,
      icon,
      iconPosition = 'left',
      loading = false,
      disabled,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cx(
          buttonVariants({
            color,
            size,
            iconPosition,
            loading,
          }),
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" size={16} />}
        {!loading && (
          <>
            {icon && <DynamicLucideIcon name={icon} strokeWidth={1.5} />}
            {children}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
export { buttonVariants };
