import { cva, cx } from '~/utils/cva';

// Scale-specific Slider Variants (for VisualAnalogScale and LikertScale)
// Uses base-ui slider which sets --slider-thumb-position CSS custom property
export const sliderRootVariants = cva({
  base: cx('relative flex w-full touch-none items-center select-none'),
  variants: {
    state: {
      normal: 'cursor-pointer',
      disabled: 'cursor-not-allowed opacity-50',
      readOnly: 'cursor-default',
      invalid: '',
    },
  },
  defaultVariants: {
    state: 'normal',
  },
});

export const sliderControlVariants = cva({
  base: cx('relative flex h-10 w-full items-center'),
});

export const sliderTrackVariants = cva({
  base: cx('relative h-4 w-full border-2', 'transition-colors duration-200'),
  variants: {
    state: {
      normal: 'bg-input border-transparent',
      disabled: 'bg-input-contrast/5 border-transparent',
      readOnly: 'bg-input-contrast/10 border-transparent',
      invalid: 'bg-input border-destructive',
    },
  },
  defaultVariants: {
    state: 'normal',
  },
});

export const sliderThumbVariants = cva({
  base: cx(
    // Positioning - base-ui sets --slider-thumb-position
    'absolute top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2',
    'left-(--slider-thumb-position)',
    // Appearance
    'block rounded-full',
    'focusable',
    'transition-colors duration-200',
  ),
  variants: {
    state: {
      normal: 'bg-accent cursor-grab active:cursor-grabbing',
      disabled: 'bg-input-contrast/30 pointer-events-none',
      readOnly: 'bg-input-contrast/50 pointer-events-none',
      invalid: 'bg-accent',
    },
  },
  defaultVariants: {
    state: 'normal',
  },
});

export const sliderTickContainerStyles = cx('absolute inset-0 w-full');

export const sliderTickStyles = cx('bg-input-contrast/20 h-full w-1');

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

// Text size variants - can be composed with other variants for consistent text scaling
export const textSizeVariants = cva({
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

// Height variants for controls - separated from text size for flexibility
export const heightVariants = cva({
  variants: {
    size: {
      sm: 'h-10',
      md: 'h-12',
      lg: 'h-13',
      xl: 'h-14',
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
      sm: 'h-5',
      md: 'h-6',
      lg: 'h-8',
      xl: 'h-10',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Set the size of any child SVG icons to slightly above 1em to match text height
export const proportionalLucideIconVariants = cva({
  base: '[&>.lucide]:h-[1em] [&>.lucide]:max-h-full [&>.lucide]:w-auto [&>.lucide]:shrink-0',
});

// adds background and border styles for input-like controls
export const inputControlVariants = cva({
  base: cx('bg-input text-input-contrast', 'border-input-contrast/10'),
});

// Spacing between elements within a wrapper, such as icons and text
export const inlineSpacingVariants = cva({
  base: 'gap-4',
});

export const wrapperPaddingVariants = cva({
  base: 'px-6',
});

// Spacing for groups of controls
export const groupSpacingVariants = cva({
  base: 'gap-2 p-4',
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
      invalid: cx('border-destructive'),
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
    'pr-[1.5em]', // Right padding to prevent text from overlapping with dropdown arrow
  ),
});
