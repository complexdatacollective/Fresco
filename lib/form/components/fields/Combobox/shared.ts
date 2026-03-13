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
import { compose, cva, cx } from '~/utils/cva';

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
    'flex cursor-pointer items-center gap-2 rounded-sm px-3',
    'transition-colors outline-none',
    'hover:bg-accent/10',
    'data-highlighted:bg-accent/10',
    'data-selected:bg-selected/15',
    // Disabled state styling
    'data-disabled:cursor-not-allowed data-disabled:opacity-50',
    'data-disabled:hover:bg-transparent',
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
