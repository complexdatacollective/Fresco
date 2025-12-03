import { compose, cva, cx } from '~/utils/cva';

// Small size variants for controls like checkboxes and radio buttons
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

export const proportionalLucideIconVariants = cva({
  // Set the size of any child SVG icons to slightly above 1em to match text height
  base: '[&>.lucide]:h-[1.2em] [&>.lucide]:max-h-full [&>.lucide]:w-auto [&>.lucide]:shrink-0',
});

export const controlVariants = cva({
  base: cx(
    'flex min-w-auto items-center justify-between',
    'overflow-hidden',
    'truncate text-nowrap',
    'rounded',
    'outline-transparent',
    'border-2 border-transparent',
  ),
});

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

export const controlContainerVariants = compose(
  controlVariants,
  cva({
    base: 'bg-input text-input-contrast transition-all duration-200',
  }),
);

export const placeholderVariants = cva({
  base: cx('placeholder:text-input-contrast/50 placeholder:italic'),
});

export const controlStateVariants = cva({
  // Group allows styling based on parent state
  base: cx(
    'border-(--input-border) [--input-border:oklch(from_var(--color-input-contrast)_l_c_h/0.2)]',
    'cursor-default group-data-[dirty=true]:group-data-[invalid=true]:[--input-border:var(--color-destructive)]',
    'data-checked:bg-accent data-checked:focus-within:outline-accent data-checked:text-selected-contrast data-checked:[--input-border:var(--accent)]',
    'group-data-focused:border-accent group-data-focused:elevation-low group-data-focused:translate-y-[-2px]',
    //Hover
    'hover:[--input-border:oklch(from_var(--color-accent)_l_c_h/0.4)]',
    // Focus state: add shadow and translate up slightly
    'focus-visible-within:elevation-low focus-visible-within:translate-y-[-2px] focus-visible-within:[--input-border:var(--color-accent)]',
    // Invalid state
  ),
});

export const selectBackgroundVariants = cx(
  'cursor-[inherit] bg-transparent',
  // Because of tailwind/forms plugin, we get styles from .form-select
  // Some are overridden here
  'w-full border-0 p-0 outline-none focus:ring-0',
  'bg-right pe-[1.5em]', // additional padding for background icon
);

// Variants for wrappers around controls. Note differences with controlContainerVariants.
export const controlWrapperVariants = compose(
  sizeVariants,
  inlineSpacingVariants,
  controlContainerVariants,
  controlStateVariants,
);

// Variants for GROUP containers (checkbox groups, radio groups, etc).
export const controlGroupVariants = compose(
  groupSpacingVariants,
  controlContainerVariants,
  controlStateVariants,
);

export const checkboxContainerVariants = controlWrapperVariants;

export const checkboxIndicatorSizeVariants = cva({
  variants: {
    size: {
      xs: 'h-3 w-3',
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
      xl: 'h-6 w-6',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export const checkboxIndicatorVariants = cva({
  base: cx('pointer-events-none', 'flex items-center justify-center'),
});

// CheckboxGroup-specific variants
export const checkboxGroupSizeVariants = cva({
  variants: {
    size: {
      xs: 'gap-2 text-xs',
      sm: 'gap-2 text-sm',
      md: 'gap-3 text-base',
      lg: 'gap-3 text-lg',
      xl: 'gap-4 text-xl',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export const checkboxGroupContainerVariants = cva({
  base: cx(
    'w-full',
    'transition-all duration-200',
    'rounded',
    'border-2',
    'p-6',
    'bg-input',
    'focusable-within outline-transparent',
  ),
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

export const checkboxGroupStateVariants = cva({
  variants: {
    state: {
      disabled: cx(
        'cursor-not-allowed',
        'bg-input-contrast/5',
        'focus-within:outline-input-contrast/50',
      ),
      readOnly: cx(
        'cursor-default',
        'bg-input-contrast/10',
        'focus-within:outline-input-contrast/70',
      ),
      invalid: cx(
        'border-destructive border-2',
        'focus-within:outline-destructive',
      ),
      normal: '',
    },
  },
  defaultVariants: {
    state: 'normal',
  },
});

export const checkboxOptionSizeVariants = cva({
  variants: {
    size: {
      xs: 'gap-2',
      sm: 'gap-2',
      md: 'gap-3',
      lg: 'gap-3',
      xl: 'gap-4',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export const checkboxOptionContainerVariants = cva({
  base: cx(
    'flex items-center',
    'cursor-pointer',
    'group',
    'transition-all duration-200',
    'has-disabled:cursor-not-allowed has-disabled:opacity-50',
  ),
});

export const checkboxLabelVariants = cva({
  base: cx(
    'select-none',
    'transition-all duration-200',
    'cursor-pointer',
    'group-has-disabled:text-current/70',
  ),
});
