import cx from 'classnames';
import React, { useCallback, useId, useState } from 'react';
import { useFieldContext } from '~/lib/form/utils/formContexts';
import Icon from '~/lib/ui/components/Icon';
import MarkdownLabel from './MarkdownLabel';

const toInt = (value) => {
  const int = parseInt(value, 10);
  if (Number.isNaN(int)) {
    return null;
  }
  return int;
};

const NumberInput = ({
  label,
  placeholder = 'Enter a number...',
  fieldLabel,
  className = '',
  autoFocus = false,
  hidden = false,
  adornmentLeft,
  adornmentRight,
  ...numberInputProps
}) => {
  const fieldContext = useFieldContext();
  const id = useId();
  const [hasFocus, setFocus] = useState(false);

  const handleFocus = useCallback(() => {
    setFocus(true);
  }, []);

  const handleBlur = useCallback(() => {
    setFocus(false);
    // Convert current value to int when blurring
    const currentValue = fieldContext.state.value;
    if (typeof currentValue === 'string') {
      fieldContext.handleChange(toInt(currentValue));
    }
    fieldContext.handleBlur();
  }, [fieldContext]);

  const handleChange = useCallback((e) => {
    const value = e.target.value;
    // Allow empty string for user input, convert on blur
    if (value === '') {
      fieldContext.handleChange('');
    } else {
      fieldContext.handleChange(toInt(value));
    }
  }, [fieldContext]);

  const handleKeyDown = useCallback((e) => {
    // Only allow numeric characters, '-', backspace, delete, and arrow keys
    if (
      !/^[0-9-]$/.test(e.key) &&
      ![
        'Backspace',
        'Delete',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Tab',
        'Enter',
      ].includes(e.key)
    ) {
      e.preventDefault();
    }
  }, []);

  const hasLeftAdornment = !!adornmentLeft;
  const hasRightAdornment = !!adornmentRight;
  const hasAdornment = hasLeftAdornment || hasRightAdornment;

  const seamlessClasses = cx(className, 'form-field-text', {
    'form-field-text--has-focus': hasFocus,
    'form-field-text--has-error': !fieldContext.state.meta.isValid && fieldContext.state.meta.isTouched && fieldContext.state.meta.errors?.[0],
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
          id={id}
          name={fieldContext.name}
          value={fieldContext.state.value || ''}
          className="form-field form-field-text__input"
          placeholder={placeholder}
          autoFocus={autoFocus}
          type="number"
          onBlur={handleBlur}
          onFocus={handleFocus}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          {...numberInputProps}
        />
        {adornmentLeft && (
          <div className="form-field-text__adornment-left">{adornmentLeft}</div>
        )}
        {adornmentRight && (
          <div className="form-field-text__adornment-right">
            {adornmentRight}
          </div>
        )}
        {!fieldContext.state.meta.isValid && fieldContext.state.meta.isTouched && (
          <div className="form-field-text__error">
            <Icon name="warning" />
            {fieldContext.state.meta.errors?.[0]}
          </div>
        )}
      </div>
    </div>
  );
};

NumberInput.propTypes = {};

export default NumberInput;
