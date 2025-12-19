import { cva, cx } from '~/utils/cva';

// Transition styles as a simple string for inline use
export const transitionStyles = 'transition-all duration-200';

// Scale-specific Slider Styles (for VisualAnalogScale and LikertScale)
export const scaleSliderStyles = {
  root: cx(
    'relative flex w-full touch-none items-center select-none',
    'data-disabled:cursor-not-allowed data-disabled:opacity-50',
  ),
  track: cx('bg-input relative h-6 w-full grow overflow-hidden rounded border'),
  thumb: cx(
    'bg-accent block h-8 w-8 rounded-full transition-all duration-200',
    'focusable',
    'disabled:pointer-events-none disabled:opacity-50',
    'hover:h-9 hover:w-9 active:h-10 active:w-10',
  ),
  tickContainer: cx(
    'absolute inset-0 flex w-full grow items-center justify-between px-[10px]',
  ),
  tick: cx('bg-input-contrast/20 h-8 w-1'),
} as const;

// Base variants for all 'control' like components (inputs, buttons, etc)
export const controlVariants = cva({
  base: cx(
    'flex min-w-auto items-center justify-between',
    'overflow-hidden',
    'truncate text-nowrap',
    'rounded',
    'border-2 border-transparent',
  ),
});

// Base size variants for controls
export const sizeVariants = cva({
  variants: {
    size: {
      xs: 'h-8 text-xs',
      sm: 'h-10 text-sm',
      md: 'h-12 text-base',
      lg: 'h-14 text-lg',
      xl: 'h-16 text-xl',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Small size variants for controls that should use a smaller scale, such as checkboxes
export const smallSizeVariants = cva({
  variants: {
    size: {
      sm: 'h-5 text-sm',
      md: 'h-6 text-base',
      lg: 'h-8 text-lg',
      xl: 'h-10 text-xl',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Set the size of any child SVG icons to slightly above 1em to match text height
export const proportionalLucideIconVariants = cva({
  base: '[&>.lucide]:h-[1.2em] [&>.lucide]:max-h-full [&>.lucide]:w-auto [&>.lucide]:shrink-0',
});

// adds background and border styles for input-like controls
export const inputControlVariants = cva({
  base: cx('bg-input text-input-contrast', 'border-input-contrast/10'),
});

// Spacing between elements within a wrapper, such as icons and text
export const inlineSpacingVariants = cva({
  variants: {
    size: {
      xs: 'gap-2 px-3',
      sm: 'gap-3 px-4',
      md: 'gap-4 px-6',
      lg: 'gap-5 px-8',
      xl: 'gap-6 px-10',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Spacing for groups of controls
export const groupSpacingVariants = cva({
  base: 'gap-2',
  variants: {
    size: {
      xs: 'px-2 py-2',
      sm: 'px-3 py-3',
      md: 'px-4 py-4',
      lg: 'px-6 py-5',
      xl: 'px-8 py-6',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Variants for placeholder text styling
export const placeholderVariants = cva({
  base: cx('placeholder:text-input-contrast/50 placeholder:italic'),
});

// Variants for multi-line text content areas (TextArea, RichTextEditor)
export const multilineContentVariants = cva({
  base: cx('min-h-[120px] w-full px-6 py-4'),
});

// State variants for controls handling disabled, readOnly, invalid, normal states
export const stateVariants = cva({
  base: cx('transition-colors duration-200'),
  variants: {
    state: {
      disabled: cx(
        'pointer-events-none cursor-not-allowed',
        'bg-input-contrast/5',
      ),
      readOnly: cx('cursor-default', 'bg-input-contrast/10'),
      invalid: cx('border-destructive border-2'),
      normal: '',
    },
  },
  defaultVariants: {
    state: 'normal',
  },
});

// As above, but adding focus and hover styles for interactive elements
export const interactiveStateVariants = cva({
  base: cx('transition-colors duration-200'),
  variants: {
    state: {
      disabled: cx('focus-within:border-input-contrast/50'),
      readOnly: cx('focus-within:border-input-contrast/70'),
      invalid: '',
      normal:
        'not-focus-within:hover:border-accent/50 focus-within:border-accent',
    },
  },
  defaultVariants: {
    state: 'normal',
  },
});

// Variants for displaying items in vertical or horizontal orientation
export const orientationVariants = cva({
  variants: {
    orientation: {
      vertical: 'flex flex-col',
      horizontal: 'flex flex-row flex-wrap',
    },
    useColumns: {
      true: cx(
        'grid',
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
      class: 'grid! flex-none!',
    },
  ],
  defaultVariants: {
    orientation: 'vertical',
    useColumns: false,
  },
});

export const controlLabelVariants = cva({
  base: cx('text-balance select-none'),
  variants: {
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Variants for native select element styling
// Uses background-image approach similar to Tailwind forms plugin
// Icon is Lucide chevron-down with stroke-width 2.5, using currentColor
export const nativeSelectVariants = cva({
  base: cx(
    'h-full w-full',
    'cursor-[inherit]',
    '[font-size:inherit]',
    'appearance-none border-none bg-transparent bg-none p-0 outline-none focus:ring-0',
    'disabled:bg-transparent', // Prevent browser default disabled background from overriding wrapper
    // Dropdown arrow icon as background-image (Lucide chevron-down, stroke-width 2.5)
    'bg-no-repeat',
    'bg-[length:1.2em_1.2em]',
    "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]",
    'bg-right',
  ),
});

// Variants for radio input indicator (the circle)
export const radioIndicatorVariants = cva({
  base: cx(
    'relative appearance-none',
    'rounded-full border-2',
    'bg-input border-input-contrast/20',
    'transition-colors duration-200',
    // Checked state
    'checked:border-accent checked:bg-input',
    'checked:after:bg-accent checked:after:absolute checked:after:rounded-full checked:after:content-[""]',
    // Hover states
    'not-checked:not-disabled:hover:border-accent/50',
    // Disabled state
    'disabled:cursor-not-allowed disabled:opacity-50',
  ),
  variants: {
    size: {
      sm: 'h-5 w-5 checked:after:inset-[3px]',
      md: 'h-6 w-6 checked:after:inset-[4px]',
      lg: 'h-8 w-8 checked:after:inset-[5px]',
      xl: 'h-10 w-10 checked:after:inset-[7px]',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Variants for boolean field buttons (yes/no style)
export const booleanButtonVariants = cva({
  base: cx(
    'flex flex-1 items-center gap-3',
    'rounded border-2 px-6 py-3 text-left text-base font-medium',
    'bg-input border-transparent',
    'transition-colors duration-200',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'focus-visible:ring-accent focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
  ),
  variants: {
    selected: {
      true: '',
      false: 'hover:border-accent/30',
    },
    positive: {
      true: '',
      false: '',
    },
  },
  compoundVariants: [
    {
      selected: true,
      positive: true,
      class: 'border-success',
    },
    {
      selected: true,
      positive: false,
      class: 'border-destructive',
    },
  ],
  defaultVariants: {
    selected: false,
    positive: true,
  },
});

// Variants for the round indicator inside boolean buttons
export const booleanIndicatorVariants = cva({
  base: cx(
    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
    'transition-colors duration-200',
  ),
  variants: {
    selected: {
      true: '',
      false: 'bg-input border-input-contrast/20',
    },
    positive: {
      true: '',
      false: '',
    },
  },
  compoundVariants: [
    {
      selected: true,
      positive: true,
      class: 'bg-success border-success text-success-contrast',
    },
    {
      selected: true,
      positive: false,
      class: 'bg-destructive border-destructive text-destructive-contrast',
    },
  ],
  defaultVariants: {
    selected: false,
    positive: true,
  },
});
