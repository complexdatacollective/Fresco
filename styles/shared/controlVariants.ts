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
    'flex items-center justify-between min-w-auto',
    'overflow-hidden',
    'truncate text-nowrap',
    'rounded',
    'outline-transparent',
    'border-2 border-transparent',
  ),
});

export const spacingVariants = cva({
  variants: {
    size: {
      xs: 'px-3 gap-2',
      sm: 'px-4 gap-3',
      md: 'px-6 gap-4',
      lg: 'px-8 gap-5',
      xl: 'px-10 gap-6',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export const controlContainerVariants = compose(
  controlVariants,
  cva({
    base: 'border-current/10 bg-input text-input-contrast transition-all duration-200',
  }),
);

export const placeholderVariants = cva({
  base: cx('placeholder:text-input-contrast/50 placeholder:italic'),
});

export const controlStateVariants = cva({
  // Group allows styling based on parent state
  base: cx(
    'group-data-[invalid=true]:border-current cursor-default',
    'data-[checked]:border-accent data-[checked]:bg-accent data-checked:focus-within:outline-accent data-[checked]:text-selected-contrast',
    //Hover
    'hover:border-accent/40',
    // Focus state: add shadow and translate up slightly
    // 'focus-visible-within:elevation-low focus-visible-within:translate-y-[-2px] focus-visible-within:border-accent',
    // Invalid state
  ),
  variants: {
    state: {
      disabled: cx(
        'focus-within:outline-input-contrast/50 bg-input-contrast/5 text-input-contrast/50 cursor-not-allowed',
        'bg-input-contrast/5 text-input-contrast/50',
        'data-[checked]:border-current/20 data-[checked]:bg-input-contrast/5 data-[checked]:text-input-contrast/50',
      ),
      readOnly: cx(
        'focus-within:outline-input-contrast/70 bg-input-contrast/10 text-input-contrast/70',
        'bg-input-contrast/10 text-input-contrast/70',
        'data-[checked]:border-current/20 data-[checked]:bg-input-contrast/10 data-[checked]:text-input-contrast/70',
      ),
      invalid: cx(
        'border-2 border-current text-destructive focus-within:outline-destructive',
        'data-checked:border-destructive data-checked:bg-destructive data-[checked]:text-selected-contrast',
      ),
      normal: '',
    },
  },
  defaultVariants: {
    state: 'normal',
  },
});

export const selectBackgroundVariants = cx(
  'bg-transparent cursor-[inherit]',
  // Because of tailwind/forms plugin, we get styles from .form-select
  // Some are overridden here
  'w-full border-0 p-0 outline-none focus:ring-0',
  'bg-right pe-[1.5em]', // additional padding for background icon
);

export const controlWrapperVariants = compose(
  sizeVariants,
  spacingVariants,
  controlContainerVariants,
  controlStateVariants,
);

export const checkboxContainerVariants = cva({
  base: cx(
    'shrink-0',
    'flex items-center justify-center',
    'appearance-none',
    'relative',
    'rounded-full',
    'border-2 border-current/20',
    'bg-input text-input-contrast',
    'focusable outline-transparent',
    'cursor-pointer',
  ),
});

export const checkboxIndicatorSizeVariants = cva({
  variants: {
    size: {
      xs: 'w-3 h-3',
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
      xl: 'w-6 h-6',
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
    'border-2 border-current/20',
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
      class: '!flex-none !grid',
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
        'border-2 border-destructive',
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
    'has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50',
  ),
});

export const checkboxLabelVariants = cva({
  base: cx(
    'select-none',
    'transition-all duration-200',
    'cursor-pointer',
    'group-has-[:disabled]:text-current/70',
  ),
});
