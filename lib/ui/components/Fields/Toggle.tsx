'use client';

import cx from 'classnames';
import React, { useEffect, useId } from 'react';
import Icon from '../Icon';
import MarkdownLabel from './MarkdownLabel';

type InputProps = {
  name?: string;
  value?: string | number | readonly string[] | undefined;
  onChange: (e: boolean) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  checked?: boolean;
};

type MetaProps = {
  error?: string;
  invalid?: boolean;
  touched?: boolean;
};

type ToggleProps = {
  label?: string;
  fieldLabel?: string;
  className?: string;
  input: InputProps;
  disabled?: boolean;
  title?: string;
  meta: MetaProps;
};

const Toggle = ({
  label,
  fieldLabel,
  className = '',
  input,
  disabled = false,
  title,
  meta: { error, invalid, touched },
  ...rest
}: ToggleProps) => {
  // Use React's useId hook to generate a stable ID
  const id = useId();

  // Handle the initial value setup
  useEffect(() => {
    // Because redux forms will just not pass on this
    // field if it was never touched and we need it to
    // return `false`.
    if (typeof input.value !== 'boolean') {
      input.onChange(false);
    }
  }, [input]);

  const containerClassNames = cx('form-field-container', {
    'form-field-toggle--has-error': invalid && touched && error,
  });

  const componentClasses = cx('form-field', 'form-field-toggle', className, {
    'form-field-toggle--disabled': disabled,
    'form-field-toggle--has-error': invalid && touched && error,
  });

  return (
    <div className={containerClassNames} data-name={input.name}>
      {fieldLabel && <MarkdownLabel label={fieldLabel} />}
      <label className={componentClasses} htmlFor={id} title={title}>
        <input
          className="form-field-toggle__input"
          id={id}
          {...rest}
          name={input.name}
          value={input.value}
          checked={!!input.value}
          onChange={(e) => input.onChange(e.target.checked)}
          onBlur={input.onBlur}
          onFocus={input.onFocus}
          disabled={disabled}
          type="checkbox"
        />
        <div className="form-field-toggle__toggle">
          <span className="form-field-toggle__button" />
        </div>
        {label && (
          <MarkdownLabel
            inline
            label={label}
            className="form-field-inline-label"
          />
        )}
      </label>
      {invalid && touched && (
        <div className="form-field-toggle__error">
          <Icon name="warning" />
          {error}
        </div>
      )}
    </div>
  );
};

export default Toggle;
