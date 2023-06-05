import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { uniqueId } from 'lodash';
import cx from 'classnames';
import Icon from '../Icon';
import MarkdownLabel from './MarkdownLabel';

class TextArea extends PureComponent {
  constructor(props) {
    super(props);
    this.id = uniqueId('label');
  }

  render() {
    const {
      meta: {
        active, error, invalid, touched,
      },
      label,
      placeholder,
      fieldLabel,
      className,
      type,
      autoFocus,
      hidden,
      input,
    } = this.props;

    const seamlessClasses = cx(
      className,
      'form-field-text',
      {
        'form-field-text--has-focus': active,
        'form-field-text--has-error': invalid && touched && error,
      },
    );

    return (
      <label
        htmlFor={this.id}
        className="form-field-container"
        hidden={hidden}
        name={input.name}
      >
        {
          (fieldLabel || label)
            ? (<MarkdownLabel label={fieldLabel || label} />)
            : ''
        }
        <div className={seamlessClasses}>
          <textarea
            id={this.id}
            className="form-field form-field-text form-field-text--area form-field-text__input"
            placeholder={placeholder}
            autoFocus={autoFocus} // eslint-disable-line
            type={type}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...input}
          />
          {invalid && touched && (
          <div className="form-field-text__error">
            <Icon name="warning" />
            {error}
          </div>
          )}
        </div>
      </label>
    );
  }
}

TextArea.propTypes = {
  input: PropTypes.object,
  meta: PropTypes.object,
  type: PropTypes.string,
  label: PropTypes.string,
  autoFocus: PropTypes.bool,
  fieldLabel: PropTypes.string,
  className: PropTypes.string,
  placeholder: PropTypes.string,
  hidden: PropTypes.bool,
};

TextArea.defaultProps = {
  input: {},
  meta: {},
  type: 'text',
  autoFocus: false,
  label: null,
  fieldLabel: null,
  placeholder: '',
  className: '',
  hidden: false,
};

export default TextArea;
