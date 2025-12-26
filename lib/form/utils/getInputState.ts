// Utility function to take Field meta and return a state that can be used in inputVariants (valid, invalid, warning, disabled)
export function getInputState(props: {
  // 'data-isValidating'?: boolean;
  'disabled'?: boolean;
  'readOnly'?: boolean;
  'aria-invalid'?: boolean;
}) {
  const {
    // 'data-isValidating': isValidating,
    'disabled': isDisabled,
    'readOnly': isReadOnly,
    'aria-invalid': isInvalid,
  } = props;

  // if (isValidating) return 'valid';

  if (isDisabled) return 'disabled';
  if (isReadOnly) return 'readOnly';
  if (isInvalid) return 'invalid';
  return 'normal';
}
