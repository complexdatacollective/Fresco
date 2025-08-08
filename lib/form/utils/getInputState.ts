import { type BaseFieldProps } from '../types';

// Utility function to take Field meta and return a state that can be used in inputVariants (valid, invalid, warning, disabled)
export function getInputState(meta: BaseFieldProps['meta']) {
  if (meta.isValidating) return 'valid';
  if (meta.isTouched && meta.errors && meta.errors.length > 0) return 'invalid';
  if (meta.isDirty) return 'warning';
  return 'valid';
}
