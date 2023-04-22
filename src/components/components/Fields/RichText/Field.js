import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import uuid from 'uuid/v4';
import Icon from '../../Icon';
import RichText from './RichText';
import MarkdownLabel from '../MarkdownLabel';

const RichTextField = ({
  input,
  meta: {
    error, active, invalid, touched,
  },
  label,
  placeholder,
  autoFocus,
  inline,
  disallowedTypes,
  className,
}) => {
  const id = useRef(uuid());

  const anyLabel = label;

  const seamlessClasses = cx(
    className,
    'form-field-rich-text',
    {
      'form-field-rich-text--has-focus': active,
      'form-field-rich-text--has-error': invalid && touched && error,
    },
  );

  return (
    <div className="form-field-container">
      { anyLabel
        && <MarkdownLabel label={anyLabel} />}
      <div className={seamlessClasses}>
        <RichText
          id={id.current}
          value={input.value}
          onChange={input.onChange}
          onFocus={input.onFocus}
          onBlur={input.onBlur}
          placeholder={placeholder}
          autoFocus={autoFocus}
          inline={inline}
          disallowedTypes={disallowedTypes}
        />
        {invalid && touched && (
          <div className="form-field-rich-text__error">
            <Icon name="warning" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

RichTextField.propTypes = {
  input: PropTypes.shape({
    value: PropTypes.string,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
  }).isRequired,
  label: PropTypes.string,
  meta: PropTypes.shape({
    error: PropTypes.string,
    active: PropTypes.bool,
    invalid: PropTypes.bool,
    touched: PropTypes.bool,
  }),
  placeholder: PropTypes.string,
  autoFocus: PropTypes.bool,
  inline: PropTypes.bool,
  disallowedTypes: PropTypes.array,
  className: PropTypes.string,
};

RichTextField.defaultProps = {
  autoFocus: false,
  placeholder: undefined,
  label: null,
  meta: {},
  inline: false,
  disallowedTypes: [],
  className: null,
};

export default RichTextField;
