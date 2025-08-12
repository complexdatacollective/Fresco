import { cx } from '~/utils/cva';
import { cva } from '~/utils/cva';

// ============================================================================
// Transition Styles
// ============================================================================
export const transitionStyles = 'transition-all duration-200';

// ============================================================================
// Text and Typography Styles
// ============================================================================
export const textStyles = {
  base: 'text-input-foreground placeholder:text-input-foreground/50 placeholder:italic',
  invalid: 'aria-[invalid=true]:text-destructive',
  disabled:
    'disabled:text-muted-foreground disabled:placeholder:text-muted-foreground/50',
  readOnly: 'is-read-only:text-muted-foreground',
} as const;

export const labelTextStyles = {
  base: 'text-foreground select-none',
  disabled: 'group-has-[input:disabled]:text-muted-foreground',
  size: {
    sm: 'text-sm leading-5',
    md: 'text-base leading-6',
    lg: 'text-lg leading-7',
  },
} as const;

// ============================================================================
// Background Styles
// ============================================================================
export const backgroundStyles = {
  base: 'bg-input',
  disabled: 'disabled:bg-muted',
  readOnly: 'is-read-only:bg-muted/50',
} as const;

// ============================================================================
// Border Styles
// ============================================================================
export const borderStyles = {
  base: 'rounded-lg border border-border',
  invalid: 'aria-[invalid=true]:border-destructive',
  focus: 'focus:border-accent/50',
  focusInvalid: 'aria-[invalid=true]:focus:border-destructive',
  focusReadOnly: 'is-read-only:focus:border-border',
} as const;

// ============================================================================
// Focus Ring Styles
// ============================================================================
export const focusRingStyles = {
  base: 'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/10 focus-visible:ring-offset-0',
  invalid: 'aria-[invalid=true]:focus-visible:ring-destructive/20',
} as const;

// ============================================================================
// Cursor Styles
// ============================================================================
export const cursorStyles = {
  base: 'cursor-pointer',
  disabled: 'disabled:cursor-not-allowed',
  readOnly: 'is-read-only:cursor-default',
} as const;

// ============================================================================
// Opacity Styles
// ============================================================================
export const opacityStyles = {
  disabled: 'disabled:opacity-50',
} as const;

// ============================================================================
// Size Definitions
// ============================================================================
export const sizeStyles = {
  sm: {
    height: 'h-8',
    text: 'text-sm',
    padding: 'px-3',
    gap: 'gap-2',
  },
  md: {
    height: 'h-12',
    text: 'text-base',
    padding: 'px-4',
    gap: 'gap-3',
  },
  lg: {
    height: 'h-14',
    text: 'text-lg',
    padding: 'px-5',
    gap: 'gap-3',
  },
} as const;

// ============================================================================
// Variant Definitions (for different visual styles)
// ============================================================================
export const variantStyles = {
  default: '',
  ghost: {
    base: 'border-transparent bg-transparent',
    hover: 'hover:bg-input/50',
    disabled: 'disabled:bg-transparent disabled:hover:bg-transparent',
  },
  filled: {
    base: 'border-transparent bg-muted',
    hover: 'hover:bg-muted/80',
    disabled: 'disabled:bg-muted disabled:hover:bg-muted',
  },
  outline: {
    base: 'bg-transparent',
    hover: 'hover:bg-input/20',
    disabled: 'disabled:bg-transparent disabled:hover:bg-transparent',
  },
} as const;

// ============================================================================
// Interactive Element Styles (Radio/Checkbox specific)
// ============================================================================
export const interactiveElementStyles = {
  base: cx(
    'shrink-0 border-2 border-border bg-input cursor-pointer',
    'appearance-none relative',
  ),
  checked: 'checked:border-accent checked:bg-accent',
  checkedInvalid:
    'group-data-[invalid=true]:checked:border-destructive group-data-[invalid=true]:checked:bg-destructive',
  checkedDisabled:
    'disabled:checked:bg-muted-foreground disabled:checked:border-muted-foreground',
  invalidBorder: 'group-data-[invalid=true]:border-destructive',
  focus: cx(
    'focus:outline-none focus:ring-4 focus:ring-accent/10 focus:ring-offset-0',
    'focus:border-accent/50',
  ),
  focusInvalid:
    'group-data-[invalid=true]:focus:border-destructive group-data-[invalid=true]:focus:ring-destructive/20',
} as const;

export const interactiveElementSizes = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
} as const;

// ============================================================================
// Composite Style Builders
// ============================================================================

/**
 * Builds complete input field styles
 */
export function buildInputStyles(
  options: {
    includeTransition?: boolean;
    includeFocus?: boolean;
    includeText?: boolean;
    includeBorder?: boolean;
    includeBackground?: boolean;
  } = {},
) {
  const {
    includeTransition = true,
    includeFocus = true,
    includeText = true,
    includeBorder = true,
    includeBackground = true,
  } = options;

  return cx(
    includeTransition && transitionStyles,
    includeText && [
      textStyles.base,
      textStyles.invalid,
      textStyles.disabled,
      textStyles.readOnly,
    ],
    includeBorder && [
      borderStyles.base,
      borderStyles.invalid,
      includeFocus && borderStyles.focus,
      includeFocus && borderStyles.focusInvalid,
      includeFocus && borderStyles.focusReadOnly,
    ],
    includeBackground && [
      backgroundStyles.base,
      backgroundStyles.disabled,
      backgroundStyles.readOnly,
    ],
    includeFocus && [focusRingStyles.base, focusRingStyles.invalid],
    cursorStyles.disabled,
    cursorStyles.readOnly,
  );
}

/**
 * Builds label styles for form elements
 */
export function buildLabelStyles(size: 'sm' | 'md' | 'lg' = 'md') {
  return cx(
    transitionStyles,
    labelTextStyles.base,
    labelTextStyles.disabled,
    labelTextStyles.size[size],
    cursorStyles.base,
    cursorStyles.disabled,
  );
}

/**
 * Builds variant styles for a specific variant
 */
export function buildVariantStyles(variant: keyof typeof variantStyles) {
  if (variant === 'default') return '';

  const styles = variantStyles[variant];
  return cx(styles.base, styles.hover, styles.disabled);
}

// ============================================================================
// Legacy exports for backward compatibility
// ============================================================================
export const focusVariants = cva({
  base: 'transition-all duration-300 focus-visible:outline-hidden focus-visible:ring-4 focus-visible:ring-input-foreground/10 focus-visible:ring-offset-0',
});

export const spacingVariants = cva({
  base: '',
  variants: {
    margin: {
      default: 'not-first:mt-4',
      none: 'mt-0',
    },
  },
  defaultVariants: {
    margin: 'default',
  },
});
