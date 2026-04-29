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
import { compose } from '~/utils/cva';

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
