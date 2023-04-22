import React, { memo, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import uuid from 'uuid';
import Icon from '../Icon';
import MarkdownLabel from './MarkdownLabel';

const TextInput = ({
  input,
  meta: {
    error,
    invalid,
    touched,
  },
  label,
  placeholder,
  fieldLabel,
  className,
  type,
  autoFocus,
  hidden,
  adornmentLeft,
  adornmentRight,
}) => {
  const id = useRef(uuid());
  const [hasFocus, setFocus] = useState(false);

  const handleFocus = (...args) => {
    setFocus(true);
    if (input.onFocus) { input.onFocus(...args); }
  };

  const handleBlur = (...args) => {
    setFocus(false);
    if (input.onBlur) { input.onBlur(...args); }
  };

  const hasLeftAdornment = !!adornmentLeft;
  const hasRightAdornment = !!adornmentRight;
  const hasAdornment = hasLeftAdornment || hasRightAdornment;

  const seamlessClasses = cx(
    className,
    'form-field-text',
    {
      'form-field-text--has-focus': hasFocus,
      'form-field-text--has-error': invalid && touched && error,
      'form-field-text--adornment': hasAdornment,
      'form-field-text--has-left-adornment': hasLeftAdornment,
      'form-field-text--has-right-adornment': hasRightAdornment,
    },
  );

  const anyLabel = fieldLabel || label;

  return (
    <div className="form-field-container" hidden={hidden}>
      { anyLabel
        && <MarkdownLabel label={anyLabel} />}
      <div className={seamlessClasses}>
        <input
          id={id.current}
          name={input.name}
          className="form-field form-field-text__input"
          placeholder={placeholder}
          autoFocus={autoFocus} // eslint-disable-line
          type={type}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...input}
          onBlur={handleBlur}
          onFocus={handleFocus}
        />
        { adornmentLeft && (
          <div className="form-field-text__adornment-left">
            {adornmentLeft}
          </div>
        )}
        { adornmentRight && (
          <div className="form-field-text__adornment-right">
            {adornmentRight}
          </div>
        )}
        {invalid && touched && (
        <div className="form-field-text__error">
          <Icon name="warning" />
          {error}
        </div>
        )}
      </div>

    </div>

  );
};

TextInput.propTypes = {
  adornmentLeft: PropTypes.node,
  adornmentRight: PropTypes.node,
  autoFocus: PropTypes.bool,
  className: PropTypes.string,
  fieldLabel: PropTypes.string,
  hidden: PropTypes.bool,
  input: PropTypes.object,
  label: PropTypes.string,
  meta: PropTypes.object,
  placeholder: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  type: PropTypes.oneOf([
    'text',
    'number',
    'search',
  ]),
};

TextInput.defaultProps = {
  adornmentLeft: null,
  adornmentRight: null,
  autoFocus: false,
  className: '',
  fieldLabel: null,
  hidden: false,
  input: {},
  label: null,
  meta: {},
  placeholder: 'Enter some text...',
  type: 'text',
};

export default memo(TextInput);
