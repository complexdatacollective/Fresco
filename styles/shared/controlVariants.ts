import { compose, cva, cx } from '~/utils/cva';

// Small size variants for controls that should use a smaller scale, such as checkboxes
export const smallSizeVariants = cva({
  variants: {
    size: {
      sm: 'h-4.5',
      md: 'h-6',
      lg: 'h-8',
      xl: 'h-10',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

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
  base: cx('relative flex h-10 w-full items-center px-3'),
});

export const sliderTrackVariants = cva({
  base: cx(
    'inset-surface relative h-4 w-full rounded border-2',
    'transition-colors duration-200',
  ),
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

export const sliderThumbVariants = compose(
  smallSizeVariants,
  cva({
    base: cx(
      // Positioning - base-ui sets --slider-thumb-position
      'absolute top-1/2 aspect-square -translate-1/2',
      'left-(--slider-thumb-position)',
      // Appearance
      'block rounded-full',
      // focusable-within: the nested <input type="range"> receives focus, not the div
      'focusable-within outline-primary',
      'transition-colors duration-200',
    ),
    variants: {
      state: {
        normal: 'bg-primary cursor-grab active:cursor-grabbing',
        pristine: 'bg-primary cursor-grab opacity-40 active:cursor-grabbing',
        disabled:
          'pointer-events-none bg-[color-mix(in_oklch,var(--input-contrast)_30%,currentColor)]',
        readOnly:
          'pointer-events-none bg-[color-mix(in_oklch,var(--input-contrast)_50%,currentColor)]',
        invalid: 'bg-destructive cursor-grab active:cursor-grabbing',
      },
    },
    defaultVariants: {
      state: 'normal',
    },
  }),
);

export const sliderTickContainerStyles = cx('absolute inset-0 w-full');

export const sliderTickStyles = cx(
  'h-full w-1 bg-[color-mix(in_oklab,var(--input)_70%,var(--input-contrast))]',
);

// Base variants for all 'control' like components (inputs, buttons, etc)
export const controlVariants = cva({
  base: cx(
    'flex min-w-fit items-center justify-between',
    'overflow-hidden',
    'truncate text-nowrap',
    'rounded',
    'border-2',
  ),
});

// Text size variants - can be composed with other variants for consistent text scaling
export const textSizeVariants = cva({
  variants: {
    size: {
      sm: '', // Text size causes padding etc to also scale. Given these are also adjusted for small size, we can leave text size unchanged to avoid excessive shrinking.
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

// Set the size of any child SVG icons to slightly above 1em to match text height
export const proportionalLucideIconVariants = cva({
  base: '[&>.lucide]:h-[1em] [&>.lucide]:max-h-full [&>.lucide]:w-auto [&>.lucide]:shrink-0',
});

// adds background and border styles for input-like controls
export const inputControlVariants = cva({
  base: cx('bg-input text-input-contrast'),
});

// Spacing between elements within a wrapper, such as icons and text
export const inlineSpacingVariants = cva({
  base: 'gap-2',
});

export const wrapperPaddingVariants = cva({
  base: 'tablet-landscape:px-6 px-4',
});

// Spacing for groups of controls.
// Resets --focus-color so child focusable elements (radios, checkboxes) use
// currentColor instead of inheriting from a dark-background ancestor.
export const groupSpacingVariants = cva({
  base: '[--focus-color:currentColor]',
  variants: {
    size: {
      sm: 'gap-2 rounded-sm p-3',
      md: 'tablet-landscape:px-6 tablet-landscape:py-4 tablet-landscape:gap-4 gap-3 p-4',
      lg: 'tablet-portrait:gap-4 tablet-portrait:px-6 tablet-portrait:py-4 tablet-landscape:gap-6 tablet-landscape:px-8 tablet-landscape:py-6 gap-3 p-4',
      xl: 'tablet-portrait:gap-6 tablet-portrait:px-8 tablet-portrait:py-6 tablet-landscape:gap-8 tablet-landscape:p-10 tablet-landscape:py-8 gap-4 px-6 py-4',
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
      invalid: cx('border-destructive'),
      normal: '',
    },
  },
  defaultVariants: {
    state: 'normal',
  },
});

// As above, but adding focus and hover styles for interactive elements.
// The ring is applied in two ways so every control variant gets the same look:
//   1. `has-[…]:focus-styles` — wrapper <div> lights up when a nested
//      input/textarea/select receives focus (Input, TextArea, native Select).
//   2. `focus-visible:focus-styles` — covers the case where the element the
//      variants are applied to *is itself* focusable, e.g. Base UI's
//      `Select.Trigger` renders a <button> with these classes applied directly.
//      No-op for wrapper <div>s around inputs since they aren't tabbable.
export const interactiveStateVariants = cva({
  base: cx('transition-colors duration-200'),
  variants: {
    state: {
      disabled: cx('focus-within:border-input-contrast/50'),
      readOnly: cx('focus-within:border-input-contrast/70'),
      invalid: '',
      normal:
        'has-[input:focus-visible,textarea:focus-visible,select:focus-visible]:focus-styles focus-visible:focus-styles outline-(--focus-color,currentColor)',
    },
  },
  defaultVariants: {
    state: 'normal',
  },
});

// Variants for displaying items in vertical or horizontal orientation
export const orientationVariants = cva({
  base: 'grid',
  variants: {
    orientation: {
      vertical: 'flex flex-col',
      horizontal: 'flex flex-row flex-wrap',
    },
    useColumns: {
      true: cx(
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

// `relative` is load-bearing: base-ui renders a hidden `position: absolute`
// form input inside each option. Without a positioned ancestor in the scroll
// content, that input resolves its containing block to the ScrollArea's
// non-scrolling outer wrapper, leaving it stranded at its un-scrolled
// natural-flow page position. Focusing it then auto-scrolls the whole dialog.
export const groupOptionVariants = cva({
  base: cx('relative flex items-center transition-colors duration-200'),
  variants: {
    size: {
      sm: 'gap-2',
      md: 'gap-3',
      lg: 'gap-4',
      xl: 'gap-5',
    },
    disabled: {
      true: 'cursor-not-allowed',
      false: 'cursor-pointer',
    },
  },
  defaultVariants: {
    size: 'md',
    disabled: false,
  },
});

export const controlLabelVariants = cva({
  base: cx('leading-tight! text-balance select-none'),
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

// Dropdown item styling shared by the styled Select, Combobox, and
// DropdownMenu components. Hover/highlighted (and `data-open` for submenu
// triggers) backgrounds are derived from the popover surface mixed with the
// neutral color, so the tint stays consistent with whatever the popover is
// rendered on and adapts to theme changes. Selected uses a stronger mix plus
// `font-semibold` to stay distinct from the highlight cursor.
export const dropdownItemVariants = cva({
  base: cx(
    'flex h-10 cursor-pointer items-center gap-2 rounded px-4',
    'transition-colors outline-none select-none',
    // Hover / highlighted / open: subtle translucent background
    'not-data-selected:not-data-checked:hover:bg-surface-1 not-data-selected:not-data-checked:hover:text-surface-1-contrast',
    'not-data-selected:not-data-checked:data-highlighted:bg-surface-1 not-data-selected:not-data-checked:data-highlighted:text-surface-1-contrast',
    'data-open:bg-surface-1 data-open:text-surface-1-contrast',
    // Selected / checked: solid background, won't be overridden by hover
    'data-selected:bg-surface-2 data-selected:text-surface-2-contrast data-selected:[&_.lucide]:text-sea-green',
    'data-checked:bg-surface-2 data-checked:text-surface-2-contrast data-checked:[&_.lucide]:text-sea-green',
    'data-disabled:cursor-not-allowed data-disabled:opacity-50',
    'data-disabled:hover:bg-transparent',
  ),
});

// Variants for native select element styling
// Uses background-image approach similar to Tailwind forms plugin
// Icon is Lucide chevron-down with stroke-width 2.5. `currentColor` doesn't
// resolve inside a data URL (the SVG loads in its own document context), so
// we ship two literal-colored variants and swap on the `.scheme-dark`
// ancestor class.
export const nativeSelectVariants = cva({
  base: cx(
    'size-full',
    'cursor-[inherit]',
    '[font-size:inherit]',
    'appearance-none border-none bg-transparent bg-none p-0 outline-none focus:ring-0',
    'disabled:bg-transparent', // Prevent browser default disabled background from overriding wrapper
    'bg-no-repeat',
    'bg-[length:1.2em_1.2em]',
    'bg-right',
    // Light scheme: dark chevron
    "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%230f172a%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]",
    // Dark scheme: light chevron
    "in-[.scheme-dark]:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23f8fafc%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]",
    'pr-[1.5em]', // Right padding to prevent text from overlapping with dropdown arrow
  ),
});
