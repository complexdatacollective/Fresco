import {
  controlVariants,
  heightVariants,
  inlineSpacingVariants,
  inputControlVariants,
  interactiveStateVariants,
  stateVariants,
  textSizeVariants,
  wrapperPaddingVariants,
} from '~/styles/shared/controlVariants';
import { cva, compose, cx } from '~/utils/cva';

export type ComboboxOption = {
  value: string | number;
  label: string;
  disabled?: boolean;
};

// Trigger variants - composed from shared control variants (same as Select)
export const comboboxTriggerVariants = compose(
  textSizeVariants,
  heightVariants,
  controlVariants,
  inputControlVariants,
  inlineSpacingVariants,
  wrapperPaddingVariants,
  stateVariants,
  interactiveStateVariants,
);

// Dropdown item styling - matches Select component
export const comboboxItemVariants = cva({
  base: cx(
    'flex cursor-pointer items-center gap-2 px-3',
    'transition-colors outline-none',
    'hover:bg-accent/10',
    'data-highlighted:bg-accent/10',
    'data-selected:bg-selected',
  ),
  variants: {
    size: {
      sm: 'py-1 text-xs',
      md: 'py-1.5 text-sm',
      lg: 'py-2 text-base',
      xl: 'py-2.5 text-lg',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Search input styling
export const comboboxInputVariants = cva({
  base: cx(
    'border-input-contrast/10 w-full border-b bg-transparent px-3 py-2',
    'text-surface-popover-contrast placeholder:text-surface-popover-contrast/50',
    'outline-none',
    'focus:border-accent',
  ),
  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
      xl: 'text-lg',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Action button styling (Select All / Deselect All)
export const comboboxActionVariants = cva({
  base: cx(
    'w-full cursor-pointer px-3 text-left',
    'text-accent transition-colors outline-none',
    'hover:bg-accent/10',
    'data-highlighted:bg-accent/10',
  ),
  variants: {
    size: {
      sm: 'py-1 text-xs',
      md: 'py-1.5 text-sm',
      lg: 'py-2 text-base',
      xl: 'py-2.5 text-lg',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});
