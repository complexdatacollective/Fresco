import { Loader2 } from 'lucide-react';
import React, {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import { cva, cx, type VariantProps } from '~/utils/cva';

const buttonVariants = cva({
  base: [
    // Core button styles
    'inline-flex items-center justify-center focusable',
    'font-bold text-xs tracking-wider uppercase',
    'text-center',
    'min-w-12 min-h-14 px-4',
    'rounded-[2rem] mb-[0.15rem]',
    'transition-all duration-200',
    // Default color
    'bg-sea-green text-white',
    // Disabled state
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ],
  variants: {
    color: {
      'default': 'bg-sea-green text-white',
      'primary': 'bg-primary text-primary-foreground',
      'secondary': 'bg-secondary text-secondary-foreground',
      'destructive': 'bg-destructive text-destructive-foreground',
      'success': 'bg-success text-success-foreground',
      'warning': 'bg-warning text-warning-foreground',
      'info': 'bg-info text-info-foreground',
      'white': 'bg-white text-charcoal',
      'platinum': 'bg-platinum text-charcoal',
      'platinum-dark': 'bg-platinum-dark text-charcoal',
      'sea-green': 'bg-sea-green text-white',
      'mustard': 'bg-mustard text-white',
      'neon-coral': 'bg-neon-coral text-white',
      'slate-blue': 'bg-slate-blue text-white',
      'cyber-grape': 'bg-cyber-grape text-white',
    },
    size: {
      default: 'min-w-12 min-h-14 text-xs px-4',
      small: 'min-w-0 min-h-10 text-[0.5rem] px-3',
    },
    hasIcon: {
      true: '',
      false: '',
    },
    iconPosition: {
      left: '',
      right: '',
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
    hasIcon: false,
    iconPosition: 'left',
    loading: false,
  },
});

const contentVariants = cva({
  base: 'px-8 flex-1',
  variants: {
    hasIcon: {
      true: 'ml-0',
      false: '',
    },
    iconPosition: {
      left: 'ml-0',
      right: 'mr-0',
    },
  },
  compoundVariants: [
    {
      hasIcon: true,
      iconPosition: 'left',
      className: 'ml-[-2rem]',
    },
    {
      hasIcon: true,
      iconPosition: 'right',
      className: 'mr-[-2rem]',
    },
  ],
});

const iconVariants = cva({
  base: 'mx-4',
  variants: {
    position: {
      left: 'order-1',
      right: 'order-2',
    },
  },
});

export type ButtonProps = {
  content?: ReactNode;
  icon?: ReactNode | string;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color' | 'content'> &
  VariantProps<typeof buttonVariants>;

const renderIcon = (
  icon: ReactNode | string,
  iconPosition: 'left' | 'right',
) => {
  if (!icon) return null;

  // For backward compatibility with string icons, you might want to convert them
  // to actual icon components here, or handle them differently
  const iconClasses = cx(iconVariants({ position: iconPosition }));

  if (typeof icon === 'string') {
    // If you have an Icon component available, use it here
    // return <Icon name={icon} className={iconClasses} />;
    // eslint-disable-next-line no-console
    console.warn('String icons not implemented in new Button component');
    return null;
  }

  // Clone element to add classes
  if (typeof icon === 'object' && icon !== null && 'type' in icon) {
    const iconElement = icon as React.ReactElement;
    return iconElement.type === 'svg' ||
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      iconElement.props?.className !== undefined
      ? iconElement
      : React.cloneElement(iconElement, {
          className: cx(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
            iconElement.props?.className,
            iconClasses,
          ),
        });
  }

  return icon;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      color,
      size,
      children,
      content,
      icon,
      iconPosition = 'left',
      loading = false,
      disabled,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const hasIcon = Boolean(icon);
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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
            hasIcon,
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
            {hasIcon && renderIcon(icon, iconPosition)}
            {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
            {(content || children) && (
              <span
                className={contentVariants({
                  hasIcon,
                  iconPosition,
                })}
              >
                {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
                {children || content}
              </span>
            )}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
export { buttonVariants };
