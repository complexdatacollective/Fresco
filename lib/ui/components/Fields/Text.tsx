import cx from 'classnames';
import React, { memo, useId, useState } from 'react';
import Icon from '../Icon';
import MarkdownLabel from './MarkdownLabel';

const TextInput = ({
  input,
  meta,
  label,
  placeholder = 'Enter some text...',
  fieldLabel,
  className = '',
  type = 'text',
  autoFocus = false,
  hidden = false,
  adornmentLeft,
  adornmentRight,
}: {
  input: {
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  };
  meta?: {
    error: string | null;
    invalid: boolean;
    touched: boolean;
  };
  label?: string;
  placeholder?: string;
  fieldLabel?: string;
  className?: string;
  type?: 'text' | 'number' | 'search';
  autoFocus?: boolean;
  hidden?: boolean;
  adornmentLeft?: React.ReactNode;
  adornmentRight?: React.ReactNode;
}) => {
  const id = useId();
  const [hasFocus, setFocus] = useState(false);

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setFocus(true);
    if (input.onFocus) {
      input.onFocus(event);
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setFocus(false);
    if (input.onBlur) {
      input.onBlur(event);
    }
  };

  const hasLeftAdornment = !!adornmentLeft;
  const hasRightAdornment = !!adornmentRight;
  const hasAdornment = hasLeftAdornment || hasRightAdornment;

  const seamlessClasses = cx(className, 'form-field-text', {
    'form-field-text--has-focus': hasFocus,
    'form-field-text--has-error': meta?.invalid && meta?.touched && meta?.error,
    'form-field-text--adornment': hasAdornment,
    'form-field-text--has-left-adornment': hasLeftAdornment,
    'form-field-text--has-right-adornment': hasRightAdornment,
  });

  const anyLabel = fieldLabel ?? label;

  return (
    <div className="form-field-container" hidden={hidden}>
      {anyLabel && <MarkdownLabel label={anyLabel} />}
      <div className={seamlessClasses}>
        <input
          {...input}
          id={id}
          name={input.name}
          className="form-field form-field-text__input"
          placeholder={placeholder}
          autoFocus={autoFocus}
          type={type}
          onBlur={handleBlur}
          onFocus={handleFocus}
        />
        {adornmentLeft && (
          <div className="form-field-text__adornment-left">{adornmentLeft}</div>
        )}
        {adornmentRight && (
          <div className="form-field-text__adornment-right">
            {adornmentRight}
          </div>
        )}
        {meta?.invalid && meta?.touched && (
          <div className="form-field-text__error">
            <Icon name="warning" />
            {meta?.error}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(TextInput);
