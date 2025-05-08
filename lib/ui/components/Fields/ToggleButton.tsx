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

interface ToggleButtonProps {
  label: string;
  className?: string;
  input: InputProps;
  disabled?: boolean;
  color?: string;
  fieldLabel?: string;
}

const ToggleButton = ({
  label,
  className = '',
  input,
  disabled = false,
  color = 'cat-color-seq-1',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fieldLabel, // Included but not used
  ...rest
}: ToggleButtonProps) => {
  // Use React's useId hook to generate a stable ID
  const id = useId();

  const componentClasses = cx(
    'form-field-togglebutton',
    `form-field-togglebutton-${color}`,
    className,
    {
      'form-field-togglebutton--disabled': disabled,
    },
  );

  return (
    <label className={componentClasses} htmlFor={id}>
      <div>
        <input
          className="form-field-togglebutton__input"
          id={id}
          checked={!!input.value}
          {...input}
          {...rest}
          type="checkbox"
        />
        <div className="form-field-togglebutton__checkbox">
          <MarkdownLabel inline label={label} />
        </div>
      </div>
    </label>
  );
};

export default ToggleButton;
