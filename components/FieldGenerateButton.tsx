'use client';

import { Button } from '@codaco/fresco-ui/Button';
import useFormStore from '@codaco/fresco-ui/form/hooks/useFormStore';
import { type ComponentProps } from 'react';

type FieldGenerateButtonProps = {
  /** Name of the connected form field whose value the button sets. */
  fieldName: string;
  /** Produces the value written into the field when the button is clicked. */
  generate: () => string;
} & Omit<ComponentProps<typeof Button>, 'onClick' | 'onMouseDown' | 'type'>;

/**
 * Button intended to be rendered inside a connected form field (e.g. as an
 * InputField `suffixComponent`) that writes a generated value into the field.
 *
 * Clicking a control embedded in the input wrapper blurs the input, which
 * validates the pre-change value. Because `setFieldValue` does not re-validate,
 * a stale error (e.g. "cannot be empty") would otherwise linger after the value
 * changes. This cancels the blur (preventDefault on mousedown) and re-validates
 * the field after writing, so it reflects the generated value.
 */
export function FieldGenerateButton({
  fieldName,
  generate,
  ...buttonProps
}: FieldGenerateButtonProps) {
  const setFieldValue = useFormStore((state) => state.setFieldValue);
  const validateField = useFormStore((state) => state.validateField);

  return (
    <Button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => {
        setFieldValue(fieldName, generate());
        void validateField(fieldName);
      }}
      {...buttonProps}
    />
  );
}
