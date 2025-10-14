import { Dialog, type DialogProps } from './Dialog';

/**
 * A variation of Dialog that allows external control of the open state.
 * With base-ui, the Dialog component already supports controlled usage,
 * so this component is now just a simple wrapper.
 */
export const ControlledDialog = ({ open = false, ...rest }: DialogProps) => {
  return <Dialog {...rest} open={open} />;
};
