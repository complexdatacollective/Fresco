import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { v4 as uuid } from 'uuid';
import Icon from '../Icon';
import MarkdownLabel from './MarkdownLabel';

class Toggle extends PureComponent {
  constructor(props) {
    super(props);

    this.id = uuid(); // Todo: refactor as functional component, and use useId hook

    const {
      input: {
        value,
        onChange,
      },
    } = this.props;
    // Value will be initially set to `undefined` before the component is touched.
    // redux-form will not include this field in the form values if it is `undefined`.
    // We therefore need to set the value to `false` if it is not set to a boolean.
    if (value !== true && value !== false) {
      onChange(false);
    }
  }

  render() {
    const {
      label,
      fieldLabel,
      className,
      input,
      disabled,
      title,
      meta: { error, invalid, touched },
      ...rest
    } = this.props;

    const containerClassNames = cx(
      'form-field-container',
      {
        'form-field-toggle--has-error': invalid && touched && error,
      },
    );

    const componentClasses = cx(
      'form-field',
      'form-field-toggle',
      className,
      {
        'form-field-toggle--disabled': disabled,
        'form-field-toggle--has-error': invalid && touched && error,
      },
    );

    return (
      <div className={containerClassNames} name={input.name}>
        {fieldLabel
          && <MarkdownLabel label={fieldLabel} />}
        <label className={componentClasses} htmlFor={this.id} title={title}>
          <input
            className="form-field-toggle__input"
            id={this.id}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...input}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...rest}
            checked={!!input.value}
            disabled={disabled}
            type="checkbox"
            value="true"
          />
          <div className="form-field-toggle__toggle">
            <span className="form-field-toggle__button" />
          </div>
          {label && <MarkdownLabel inline label={label} className="form-field-inline-label" />}
        </label>
        {invalid && touched && (
          <div className="form-field-toggle__error">
            <Icon name="warning" />
            {error}
          </div>
        )}
      </div>
    );
  }
}

Toggle.propTypes = {
  label: PropTypes.string,
  title: PropTypes.string,
  fieldLabel: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  input: PropTypes.object.isRequired,
  meta: PropTypes.object,
};

Toggle.defaultProps = {
  className: '',
  label: null,
  title: '',
  fieldLabel: null,
  disabled: false,
  meta: {},
};

export default Toggle;
