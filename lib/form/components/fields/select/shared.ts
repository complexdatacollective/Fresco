import {
  controlVariants,
  heightVariants,
  inlineSpacingVariants,
  inputControlVariants,
  interactiveStateVariants,
  stateVariants,
  textSizeVariants,
} from '~/styles/shared/controlVariants';
import { compose } from '~/utils/cva';

// Wrapper variants for select elements (shared by native and styled)
export const selectWrapperVariants = compose(
  textSizeVariants,
  heightVariants,
  controlVariants,
  inputControlVariants,
  inlineSpacingVariants,
  stateVariants,
  interactiveStateVariants,
);

export type SelectOption = {
  value: string | number;
  label: string;
};
