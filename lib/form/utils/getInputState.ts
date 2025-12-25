// Utility function to take Field meta and return a state that can be used in inputVariants (valid, invalid, warning, disabled)
export function getInputState(props: {
  'data-isValidating'?: boolean;
  'aria-disabled'?: boolean;
  'aria-readonly'?: boolean;
  'aria-invalid'?: boolean;
}) {
  const {
    'data-isValidating': isValidating,
    'aria-disabled': isDisabled,
    'aria-readonly': isReadOnly,
    'aria-invalid': isInvalid,
  } = props;

  if (isValidating) return 'valid';

  if (isDisabled) return 'disabled';
  if (isReadOnly) return 'readOnly';
  if (isInvalid) return 'invalid';
  return 'normal';
}
