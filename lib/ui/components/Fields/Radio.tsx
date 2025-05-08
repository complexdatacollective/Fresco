'use client';

import cx from 'classnames';
import React, { useId } from 'react';
import MarkdownLabel from './MarkdownLabel';

interface InputProps {
  name?: string;
  value?: string | number | readonly string[] | undefined;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  checked?: boolean;
}

interface RadioProps {
  label?: React.ReactNode;
  fieldLabel?: string;
  className?: string;
  disabled?: boolean;
  input: InputProps;
}

const Radio = ({
  label,
  className = '',
  input,
  disabled = false,
  ...rest
}: RadioProps) => {
  // Use React's useId hook to generate a stable ID
  const id = useId();

  const componentClasses = cx('form-field-radio', className, {
    'form-field-radio--disabled': disabled,
  });

  return (
    <label className={componentClasses} htmlFor={id}>
      <input
        type="radio"
        className="form-field-radio__input"
        id={id}
        // input.checked is only provided by redux form if type="checkbox" or type="radio" is
        // provided to <Field />, so for the case that it isn't we can rely on the more reliable
        // input.value
        checked={!!input.value}
        {...input}
        {...rest}
      />
      <div className="form-field-radio__radio" />
      {label && (
        <MarkdownLabel
          inline
          label={label}
          className="form-field-inline-label"
        />
      )}
    </label>
  );
};

export default Radio;
